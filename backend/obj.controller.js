const Obj = require('./obj.model')
const router = require('express').Router()
const crypto = require('crypto')

function generateSecretId() {
    return crypto.randomBytes(12).toString('hex')
}

router.route('/create').post(async (req, res) => {
    const name = String(req.body.name || '').trim()
    const timezone = String(req.body.timezone || 'UTC').trim() || 'UTC'
    if (!name) {
        return res.status(400).json({ error: 'Plan name is required.' })
    }

    const secretId = generateSecretId()
    const viewSecret = generateSecretId()
    const newObj = new Obj({ name, timezone, secretId, viewSecret })

    try {
        const savedObj = await newObj.save()
        res.json({
            id: savedObj._id,
            name: savedObj.name,
            secretId: savedObj.secretId,
            editUrl: `/plan/${savedObj.secretId}`,
            viewUrl: `/view/${savedObj.viewSecret}`,
        })
    } catch (err) {
        res.status(400).json({ error: 'Error saving plan.', details: err.message })
    }
})

router.get('/', async (req, res) => {
    const data = await Obj.find()
    res.send({ data })
})

router.get('/secret/:secretId', async (req, res) => {
    const plan = await Obj.findOne({ secretId: req.params.secretId })
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found.' })
    }
    res.json(plan)
})

router.get('/view/:viewId', async (req, res) => {
    const plan = await Obj.findOne({ viewSecret: req.params.viewId })
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found.' })
    }
    const out = plan.toObject()
    // Do not expose the editor secret
    delete out.secretId
    delete out.viewSecret
    res.json(out)
})

async function requireSecretPlan(req, res, next) {
    const plan = await Obj.findOne({ secretId: req.params.secretId })
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found.' })
    }
    req.plan = plan
    next()
}

router.post('/:secretId/activities', requireSecretPlan, async (req, res) => {
    const plan = req.plan

    const lat = req.body.location?.lat ?? (req.body.locationLat !== undefined ? Number(req.body.locationLat) : undefined)
    const lng = req.body.location?.lng ?? (req.body.locationLng !== undefined ? Number(req.body.locationLng) : undefined)

    const activity = {
        name: String(req.body.name || '').trim(),
        description: String(req.body.description || '').trim(),
        address: String(req.body.address || '').trim(),
        location: (lat !== undefined && lng !== undefined) ? { lat: Number(lat), lng: Number(lng) } : undefined,
        duration: String(req.body.duration || '').trim(),
        suggestedStart: req.body.suggestedStart ? String(req.body.suggestedStart) : undefined,
        suggestedEnd: req.body.suggestedEnd ? String(req.body.suggestedEnd) : undefined,
    }

    if (!activity.name) {
        return res.status(400).json({ error: 'Activity name is required.' })
    }

    plan.activities.push(activity)
    try {
        const savedObj = await plan.save()
        const savedActivity = savedObj.activities[savedObj.activities.length - 1]
        res.json({ activity: savedActivity })
    } catch (err) {
        res.status(400).json({ error: 'Error saving activity.', details: err.message })
    }
})

router.post('/:secretId/events', requireSecretPlan, async (req, res) => {
    const plan = req.plan

    const lat = req.body.activity?.location?.lat ?? (req.body.activity?.locationLat !== undefined ? Number(req.body.activity.locationLat) : undefined)
    const lng = req.body.activity?.location?.lng ?? (req.body.activity?.locationLng !== undefined ? Number(req.body.activity.locationLng) : undefined)

    const activity = {
        name: String(req.body.activity?.name || '').trim(),
        description: String(req.body.activity?.description || '').trim(),
        location: (lat !== undefined && lng !== undefined) ? { lat: Number(lat), lng: Number(lng) } : undefined,
        duration: String(req.body.activity?.duration || '').trim(),
        suggestedStart: req.body.activity?.suggestedStart ? String(req.body.activity.suggestedStart) : undefined,
        suggestedEnd: req.body.activity?.suggestedEnd ? String(req.body.activity.suggestedEnd) : undefined,
    }

    if (!activity.name) {
        return res.status(400).json({ error: 'Event activity name is required.' })
    }

    const event = {
        activity,
        start: req.body.start ? String(req.body.start) : undefined,
        end: req.body.end ? String(req.body.end) : undefined,
    }

    plan.events.push(event)
    try {
        await plan.save()
        res.json({ event })
    } catch (err) {
        res.status(400).json({ error: 'Error saving event.', details: err.message })
    }
})

router.patch('/:secretId/activities/:activityId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    const activity = plan.activities.id(req.params.activityId)
    if (!activity) {
        return res.status(404).json({ error: 'Activity not found.' })
    }

    if (typeof req.body.name === 'string') {
        activity.name = String(req.body.name).trim()
    }
    if (typeof req.body.description === 'string') {
        activity.description = String(req.body.description).trim()
    }
    if (typeof req.body.address === 'string') {
        activity.address = String(req.body.address).trim()
    }
    if (typeof req.body.duration === 'string') {
        activity.duration = String(req.body.duration).trim()
    }
    if ('suggestedStart' in req.body) {
        activity.suggestedStart = req.body.suggestedStart ? String(req.body.suggestedStart) : undefined
    }
    if ('suggestedEnd' in req.body) {
        activity.suggestedEnd = req.body.suggestedEnd ? String(req.body.suggestedEnd) : undefined
    }
    if (req.body.locationLat !== undefined && req.body.locationLng !== undefined) {
        if (req.body.locationLat === '' || req.body.locationLng === '') {
            activity.location = undefined
        } else {
            activity.location = { lat: Number(req.body.locationLat), lng: Number(req.body.locationLng) }
        }
    }

    plan.events.forEach((event) => {
        if (String(event.activity?._id) === String(activity._id)) {
            event.activity = activity.toObject ? activity.toObject() : { ...activity }
        }
    })

    try {
        await plan.save()
        res.json({ activity })
    } catch (err) {
        res.status(400).json({ error: 'Error updating activity.', details: err.message })
    }
})

router.patch('/:secretId/events/:eventId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    const event = plan.events.id(req.params.eventId)
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }

    if (req.body.activity) {
        const lat = req.body.activity?.location?.lat ?? (req.body.activity?.locationLat !== undefined ? Number(req.body.activity.locationLat) : undefined)
        const lng = req.body.activity?.location?.lng ?? (req.body.activity?.locationLng !== undefined ? Number(req.body.activity.locationLng) : undefined)
        event.activity = {
            name: String(req.body.activity?.name || '').trim(),
            description: String(req.body.activity?.description || '').trim(),
            location: (lat !== undefined && lng !== undefined) ? { lat: Number(lat), lng: Number(lng) } : undefined,
            duration: String(req.body.activity?.duration || '').trim(),
            suggestedStart: req.body.activity?.suggestedStart ? String(req.body.activity.suggestedStart) : undefined,
            suggestedEnd: req.body.activity?.suggestedEnd ? String(req.body.activity.suggestedEnd) : undefined,
        }
    }
    if ('start' in req.body) {
        event.start = req.body.start ? String(req.body.start) : undefined
    }
    if ('end' in req.body) {
        event.end = req.body.end ? String(req.body.end) : undefined
    }

    try {
        await plan.save()
        res.json({ event })
    } catch (err) {
        res.status(400).json({ error: 'Error updating event.', details: err.message })
    }
})

router.delete('/:secretId/activities/:activityId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    const activity = plan.activities.id(req.params.activityId)
    if (!activity) {
        return res.status(404).json({ error: 'Activity not found.' })
    }
    activity.remove()
    try {
        await plan.save()
        res.json({ success: true })
    } catch (err) {
        res.status(400).json({ error: 'Error deleting activity.', details: err.message })
    }
})

router.delete('/:secretId/events/:eventId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    const event = plan.events.id(req.params.eventId)
    if (!event) {
        return res.status(404).json({ error: 'Event not found.' })
    }
    event.remove()
    try {
        await plan.save()
        res.json({ success: true })
    } catch (err) {
        res.status(400).json({ error: 'Error deleting event.', details: err.message })
    }
})

router.delete('/:secretId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    try {
        await plan.deleteOne()
        res.status(200).send({ success: true })
    } catch (err) {
        res.status(400).json({ error: 'Error deleting plan.', details: err.message })
    }
})

router.patch('/:secretId', requireSecretPlan, async (req, res) => {
    const plan = req.plan
    const { name, timezone } = req.body
    if (typeof name === 'string') {
        plan.name = name
    }
    if (typeof timezone === 'string') {
        plan.timezone = timezone.trim() || 'UTC'
    }
    try {
        await plan.save()
        res.status(200).send({ data: plan })
    } catch (err) {
        res.status(400).json({ error: 'Error updating plan.', details: err.message })
    }
})

module.exports = router