import './App.css';
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = 'http://localhost:5000'

const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

const getTimeZoneList = () => {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone')
  }
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Hong_Kong',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
}

const browserTimeZone = getBrowserTimeZone()

async function fetchPlan(secretId) {
  const response = await fetch(`${API_BASE}/obj/secret/${secretId}`)
  if (!response.ok) {
    throw new Error('Plan not found')
  }
  return response.json()
}

async function createPlan(name, timezone = browserTimeZone) {
  const response = await fetch(`${API_BASE}/obj/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, timezone }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create failed')
  }
  return response.json()
}

async function updatePlan(secretId, updates) {
  const response = await fetch(`${API_BASE}/obj/${secretId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error('Update failed')
  }
  return response.json()
}

async function createActivity(secretId, activity) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create activity failed')
  }
  return response.json()
}

async function createEvent(secretId, eventData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create event failed')
  }
  return response.json()
}

async function updateActivity(secretId, activityId, activityData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities/${activityId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Update activity failed')
  }
  return response.json()
}

async function deleteActivity(secretId, activityId) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities/${activityId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Delete activity failed')
  }
  return response.json()
}

async function deleteEvent(secretId, eventId) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events/${eventId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Delete event failed')
  }
  return response.json()
}

async function updateEvent(secretId, eventId, eventData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Update event failed')
  }
  return response.json()
}

export default function App() {
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [editName, setEditName] = useState('');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [timeZones, setTimeZones] = useState([]);
  const [activityLookupLoading, setActivityLookupLoading] = useState(false);
  const viewerTabInitialized = useRef(false);
  const [editingActivityId, setEditingActivityId] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activityForm, setActivityForm] = useState({ name: '', description: '', address: '', locationLat: '', locationLng: '', duration: '', suggestedStart: '', suggestedEnd: '' });
  const [eventForm, setEventForm] = useState({ activityId: '', start: '', end: '' });

  const secretPath = window.location.pathname.startsWith('/plan/')
    ? window.location.pathname.replace('/plan/', '')
    : null
  const viewPath = window.location.pathname.startsWith('/view/')
    ? window.location.pathname.replace('/view/', '')
    : null

  async function fetchViewPlan(viewId) {
    const response = await fetch(`${API_BASE}/obj/view/${viewId}`)
    if (!response.ok) {
      throw new Error('Plan not found')
    }
    return response.json()
  }

  useEffect(() => {
    const id = viewPath || secretPath
    if (!id) return

    setLoading(true)
    const fetcher = viewPath ? fetchViewPlan : fetchPlan
    fetcher(id)
      .then((planData) => {
        setPlan({ ...planData, timezone: planData.timezone || browserTimeZone })
        setEditName(planData.name)
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [secretPath, viewPath])

  const getPlanStartTimestamp = (value) => {
    if (!value) return Number.POSITIVE_INFINITY
    const date = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
  }

  useEffect(() => {
    if (!viewPath || !plan || viewerTabInitialized.current) {
      return
    }

    const eventStarts = (plan.events || [])
      .map((event) => event.start)
      .filter(Boolean)
      .map(getPlanStartTimestamp)

    const defaultTab = eventStarts.length === 0 || Date.now() < Math.min(...eventStarts)
      ? 1
      : 2

    setActiveTab(defaultTab)
    viewerTabInitialized.current = true
  }, [viewPath, plan])

  useEffect(() => {
    setTimeZones(getTimeZoneList())
  }, [])

  const handleCreate = async () => {
    if (!planName.trim()) {
      setError('Enter a plan name.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await createPlan(planName.trim(), browserTimeZone)
      window.location.href = `${window.location.origin}${result.editUrl}`
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetActivityForm = () => {
    setActivityForm({ name: '', description: '', address: '', locationLat: '', locationLng: '', duration: '', suggestedStart: '', suggestedEnd: '' })
    setEditingActivityId('')
  }

  const resetEventForm = () => {
    setEventForm({ activityId: '', start: '', end: '' })
    setEditingEventId('')
  }

  const openActivityDialog = (activity) => {
    if (!activity) {
      resetActivityForm()
      setActivityDialogOpen(true)
      return
    }
    setEditingActivityId(String(activity._id || ''))
    setActivityForm({
      name: activity.name || '',
      description: activity.description || '',
      address: activity.address || '',
      locationLat: activity.location?.lat ?? '',
      locationLng: activity.location?.lng ?? '',
      duration: activity.duration || '',
      suggestedStart: activity.suggestedStart || '',
      suggestedEnd: activity.suggestedEnd || '',
    })
    setActivityDialogOpen(true)
  }

  const openEventDialog = (event) => {
    if (!event) {
      resetEventForm()
      setSelectedEvent(null)
      setEventDialogOpen(true)
      return
    }
    setEditingEventId(String(event._id || ''))
    setSelectedEvent(event)
    setEventForm({
      activityId: String(event.activity?._id || ''),
      start: event.start || '',
      end: event.end || '',
    })
    setEventDialogOpen(true)
  }

  const closeActivityDialog = () => {
    setActivityDialogOpen(false)
    resetActivityForm()
  }

  const closeEventDialog = () => {
    setEventDialogOpen(false)
    resetEventForm()
    setSelectedEvent(null)
  }

  const handleSaveActivity = async () => {
    if (!activityForm.name.trim()) {
      setError('Activity name is required.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload = {
        name: activityForm.name,
        description: activityForm.description,
        address: activityForm.address,
        duration: activityForm.duration,
        suggestedStart: activityForm.suggestedStart || undefined,
        suggestedEnd: activityForm.suggestedEnd || undefined,
        locationLat: activityForm.locationLat,
        locationLng: activityForm.locationLng,
      }
      if (activityForm.locationLat && activityForm.locationLng) {
        payload.location = { lat: Number(activityForm.locationLat), lng: Number(activityForm.locationLng) }
      }

      if (editingActivityId) {
        const result = await updateActivity(secretPath, editingActivityId, payload)
        setPlan((current) => {
          if (!current) return current
          const updatedActivities = (current.activities || []).map((activity) =>
            String(activity._id) === editingActivityId ? result.activity : activity
          )
          const updatedEvents = (current.events || []).map((event) =>
            String(event.activity?._id) === editingActivityId
              ? { ...event, activity: result.activity }
              : event
          )
          return { ...current, activities: updatedActivities, events: updatedEvents }
        })
      } else {
        const result = await createActivity(secretPath, payload)
        setPlan((current) => current ? { ...current, activities: [...(current.activities || []), result.activity] } : current)
      }

      closeActivityDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteActivity = async () => {
    if (!editingActivityId) return
    if (!window.confirm('Delete this activity? This cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteActivity(secretPath, editingActivityId)
      setPlan((current) => {
        if (!current) return current
        const remainingActivities = (current.activities || []).filter(
          (activity) => String(activity._id) !== editingActivityId
        )
        const remainingEvents = (current.events || []).filter(
          (event) => String(event.activity?._id) !== editingActivityId
        )
        return { ...current, activities: remainingActivities, events: remainingEvents }
      })
      closeActivityDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!editingEventId) return
    if (!window.confirm('Delete this event? This cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteEvent(secretPath, editingEventId)
      setPlan((current) => {
        if (!current) return current
        const remainingEvents = (current.events || []).filter(
          (event) => String(event._id) !== editingEventId
        )
        return { ...current, events: remainingEvents }
      })
      closeEventDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSuggest = async () => {
    if (!activityForm.address.trim()) {
      setError('Enter an address to suggest coordinates.')
      return
    }

    setActivityLookupLoading(true)
    setError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(activityForm.address)}`)
      if (!response.ok) {
        throw new Error('Address lookup failed.')
      }
      const results = await response.json()
      if (!results.length) {
        setError('No location found for that address.')
        return
      }
      const { lat, lon } = results[0]
      setActivityForm((prev) => ({ ...prev, locationLat: lat, locationLng: lon }))
    } catch (err) {
      setError(err.message)
    } finally {
      setActivityLookupLoading(false)
    }
  }

  const handleSaveEvent = async () => {
    if (!eventForm.activityId) {
      setError('Select an activity for the event.')
      return
    }

    const selectedActivity = plan?.activities?.find((activity) => String(activity._id) === String(eventForm.activityId))
    if (!selectedActivity) {
      setError('Selected activity not found.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload = {
        activity: selectedActivity,
        start: eventForm.start || undefined,
        end: eventForm.end || undefined,
      }

      if (editingEventId) {
        const result = await updateEvent(secretPath, editingEventId, payload)
        setPlan((current) => {
          if (!current) return current
          const updatedEvents = (current.events || []).map((event) =>
            String(event._id) === editingEventId ? result.event : event
          )
          return { ...current, events: updatedEvents }
        })
      } else {
        const result = await createEvent(secretPath, payload)
        setPlan((current) => current ? { ...current, events: [...(current.events || []), result.event] } : current)
      }

      closeEventDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNameBlur = async () => {
    setIsNameEditing(false)
    if (!plan) {
      return
    }

    const trimmedName = editName.trim()
    if (!trimmedName) {
      setError('Plan name cannot be empty.')
      setEditName(plan.name)
      return
    }

    if (trimmedName === plan.name) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await updatePlan(secretPath, { name: trimmedName })
      setPlan((current) => current ? { ...current, name: trimmedName } : current)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTimezoneChange = async (event) => {
    const newTimezone = event.target.value
    if (!plan) return
    const previousTimezone = plan.timezone
    setPlan((current) => current ? { ...current, timezone: newTimezone } : current)
    setLoading(true)
    setError('')
    try {
      await updatePlan(secretPath, { timezone: newTimezone })
    } catch (err) {
      setError(err.message)
      setPlan((current) => current ? { ...current, timezone: previousTimezone } : current)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const formatPlanDateTime = (value) => {
    if (!value) {
      return null
    }
    const date = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }
    return plan?.timezone
      ? date.toLocaleString(undefined, { ...options, timeZone: plan.timezone })
      : date.toLocaleString(undefined, options)
  }

  const getPlanTimestampKey = (value) => {
    if (!value) {
      return Number.POSITIVE_INFINITY
    }
    if (typeof value === 'string') {
      if (value.includes('Z') || value.includes('+')) {
        const time = new Date(value).getTime()
        return Number.isFinite(time) ? time : value
      }
      return value
    }
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
  }

  const getPlanDateIso = (value) => {
    if (!value) {
      return ''
    }
    if (typeof value === 'string') {
      return value.split('T')[0]
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: plan?.timezone || browserTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  const getTodayIso = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: plan?.timezone || browserTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }

  const renderActivities = () => {
    if (!plan?.activities?.length) {
      return <Typography color='text.secondary'>No activities yet.</Typography>
    }
    return (
      <List dense>
        {plan.activities.map((activity, index) => {
          const lat = activity?.location?.lat
          const lng = activity?.location?.lng
          return (
            <ListItem
              key={`activity-${index}`}
              button={!!secretPath || !!viewPath}
              onClick={secretPath || viewPath ? () => openActivityDialog(activity) : undefined}
              sx={{ alignItems: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <ListItemText
                    primary={activity.name}
                    secondary={activity.description ? `Description: ${activity.description}` : ''}
                  />
                </Box>
                <Box sx={{ width: 220, height: 140 }}>
                  {lat !== undefined && lng !== undefined ? (
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    )
  }

  const renderEvents = () => {
    if (!plan?.events?.length) {
      return <Typography color='text.secondary'>No events yet.</Typography>
    }
    const sortedEvents = [...plan.events].sort((a, b) => {
      const aTime = getPlanTimestampKey(a.start)
      const bTime = getPlanTimestampKey(b.start)
      if (typeof aTime === 'string' && typeof bTime === 'string') {
        return aTime.localeCompare(bTime)
      }
      return aTime - bTime
    })
    return (
      <List dense>
        {sortedEvents.map((event, index) => {
          const lat = event?.activity?.location?.lat
          const lng = event?.activity?.location?.lng
          return (
            <ListItem
              key={`event-${index}`}
              button={!!secretPath || !!viewPath}
              onClick={secretPath || viewPath ? () => openEventDialog(event) : undefined}
              sx={{ alignItems: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    {event.start ? formatPlanDateTime(event.start) : 'No start time'}
                  </Typography>
                  <ListItemText
                    primary={event.activity.name}
                    secondary={event.activity.description ? `Description: ${event.activity.description}` : ''}
                  />
                </Box>
                <Box sx={{ width: 220, height: 140 }}>
                  {lat !== undefined && lng !== undefined ? (
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    )
  }

  const renderToday = () => {
    if (!plan?.events?.length) {
      return <Typography color='text.secondary'>There are no plans for today.</Typography>
    }
    const todayIso = getTodayIso()
    const todayEvents = [...plan.events]
      .filter((event) => event.start)
      .filter((event) => getPlanDateIso(event.start) === todayIso)
      .sort((a, b) => {
        const aTime = getPlanTimestampKey(a.start)
        const bTime = getPlanTimestampKey(b.start)
        if (typeof aTime === 'string' && typeof bTime === 'string') {
          return aTime.localeCompare(bTime)
        }
        return aTime - bTime
      })

    if (!todayEvents.length) {
      return <Typography color='text.secondary'>There are no plans for today.</Typography>
    }

    return (
      <List dense>
        {todayEvents.map((event, index) => {
          const lat = event?.activity?.location?.lat
          const lng = event?.activity?.location?.lng
          return (
            <ListItem
              key={`today-${index}`}
              button={!!secretPath || !!viewPath}
              onClick={secretPath || viewPath ? () => openEventDialog(event) : undefined}
              sx={{ alignItems: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    {event.start ? formatPlanDateTime(event.start) : 'No start time'}
                  </Typography>
                  <ListItemText
                    primary={event.activity.name}
                    secondary={event.activity.description ? `Description: ${event.activity.description}` : ''}
                  />
                </Box>
                <Box sx={{ width: 220, height: 140 }}>
                  {lat !== undefined && lng !== undefined ? (
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    )
  }

  const TabPanel = ({ children, value, index }) => {
    return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null
  }

  if (viewPath) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: '#f4f6f8',
        }}
      >
        <Box sx={{ width: 500, p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: 3 }}>
          {loading && <Typography>Loading...</Typography>}
          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
          {plan && (
            <>
              <Typography variant='h5' component='h1' sx={{ mb: 1 }}>
                {plan.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mr: 1 }}>
                  Viewer URL:
                </Typography>
                <Typography variant='body2' sx={{ wordBreak: 'break-all' }}>{window.location.href}</Typography>
                <Button size='small' onClick={() => copyToClipboard(window.location.href)}>Copy</Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mr: 1 }}>
                  Time zone:
                </Typography>
                <Typography variant='body2'>{plan.timezone || browserTimeZone}</Typography>
              </Box>

              <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
                <Tab label='Activities' />
                <Tab label='Itinerary' />
                <Tab label='Today' />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                {renderActivities()}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {renderEvents()}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderToday()}
              </TabPanel>
              <Dialog open={activityDialogOpen} onClose={closeActivityDialog} fullWidth>
                <DialogTitle>{editingActivityId ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                <DialogContent>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label='Name'
                      value={activityForm.name}
                      required
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!!viewPath}
                    />
                    <TextField
                      label='Description'
                      value={activityForm.description}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
                      disabled={!!viewPath}
                    />
                    <TextField
                      label='Address'
                      value={activityForm.address}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, address: e.target.value }))}
                      fullWidth
                      disabled={!!viewPath}
                    />
                    <Stack direction='row' spacing={1} alignItems='flex-end'>
                      <TextField
                        label='Latitude'
                        type='number'
                        value={activityForm.locationLat}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLat: e.target.value }))}
                        sx={{ flex: 1 }}
                        disabled={!!viewPath}
                      />
                      <TextField
                        label='Longitude'
                        type='number'
                        value={activityForm.locationLng}
                        onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLng: e.target.value }))}
                        sx={{ flex: 1 }}
                        disabled={!!viewPath}
                      />
                      <Button
                        variant='outlined'
                        onClick={handleAddressSuggest}
                        disabled={!!viewPath || activityLookupLoading || !activityForm.address.trim()}
                      >
                        {activityLookupLoading ? 'Looking up…' : 'Suggest'}
                      </Button>
                    </Stack>
                    <TextField
                      label='Duration'
                      value={activityForm.duration}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, duration: e.target.value }))}
                      disabled={!!viewPath}
                    />
                    <TextField
                      label='Suggested Start'
                      type='datetime-local'
                      value={activityForm.suggestedStart}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedStart: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!!viewPath}
                    />
                    <TextField
                      label='Suggested End'
                      type='datetime-local'
                      value={activityForm.suggestedEnd}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedEnd: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      disabled={!!viewPath}
                    />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                  {viewPath ? (
                    <Box />
                  ) : editingActivityId ? (
                    <Button color='error' onClick={handleDeleteActivity} disabled={loading}>
                      Delete
                    </Button>
                  ) : <Box />}
                  <Box>
                    <Button onClick={closeActivityDialog}>Close</Button>
                    {!viewPath && (
                      <Button onClick={handleSaveActivity} variant='contained' disabled={loading}>
                        {editingActivityId ? 'Save Activity' : 'Add Activity'}
                      </Button>
                    )}
                  </Box>
                </DialogActions>
              </Dialog>

              <Dialog open={eventDialogOpen} onClose={closeEventDialog} fullWidth>
                <DialogTitle>{viewPath ? 'View Event' : editingEventId ? 'Edit Event' : 'Add Event'}</DialogTitle>
                <DialogContent>
                  {viewPath && selectedEvent ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Typography variant='subtitle1'>Activity</Typography>
                      <Typography><strong>Name:</strong> {selectedEvent.activity?.name || '-'}</Typography>
                      <Typography><strong>Description:</strong> {selectedEvent.activity?.description || '-'}</Typography>
                      <Typography><strong>Address:</strong> {selectedEvent.activity?.address || '-'}</Typography>
                      <Typography><strong>Duration:</strong> {selectedEvent.activity?.duration || '-'}</Typography>
                      <Typography><strong>Suggested Start:</strong> {selectedEvent.activity?.suggestedStart ? formatPlanDateTime(selectedEvent.activity.suggestedStart) : '-'}</Typography>
                      <Typography><strong>Suggested End:</strong> {selectedEvent.activity?.suggestedEnd ? formatPlanDateTime(selectedEvent.activity.suggestedEnd) : '-'}</Typography>
                      {(selectedEvent.activity?.location?.lat !== undefined && selectedEvent.activity?.location?.lng !== undefined) && (
                        <Box sx={{ width: '100%', height: 180 }}>
                          <MapContainer
                            center={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                            <Marker position={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]} />
                          </MapContainer>
                        </Box>
                      )}
                      <Divider />
                      <Typography variant='subtitle1'>Event</Typography>
                      <Typography><strong>Start:</strong> {selectedEvent.start ? formatPlanDateTime(selectedEvent.start) : '-'}</Typography>
                      <Typography><strong>End:</strong> {selectedEvent.end ? formatPlanDateTime(selectedEvent.end) : '-'}</Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel id='event-activity-label'>Select Activity</InputLabel>
                        <Select
                          labelId='event-activity-label'
                          label='Select Activity'
                          value={eventForm.activityId}
                          onChange={(e) => setEventForm((prev) => ({ ...prev, activityId: e.target.value }))}
                          disabled={!!viewPath}
                        >
                          {plan?.activities?.length ? (
                            plan.activities.map((activity) => (
                              <MenuItem key={String(activity._id || activity.name)} value={String(activity._id)}>
                                {activity.name}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem value='' disabled>
                              No saved activities yet
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        label='Event Start'
                        type='datetime-local'
                        value={eventForm.start}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, start: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        disabled={!!viewPath}
                      />
                      <TextField
                        label='Event End'
                        type='datetime-local'
                        value={eventForm.end}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, end: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        disabled={!!viewPath}
                      />
                    </Stack>
                  )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                  {viewPath ? (
                    <Box />
                  ) : editingEventId ? (
                    <Button color='error' onClick={handleDeleteEvent} disabled={loading}>
                      Delete
                    </Button>
                  ) : <Box />}
                  <Box>
                    <Button onClick={closeEventDialog}>Close</Button>
                    {!viewPath && (
                      <Button onClick={handleSaveEvent} variant='contained' disabled={loading}>
                        {editingEventId ? 'Save Event' : 'Add Event'}
                      </Button>
                    )}
                  </Box>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Box>
      </Box>
    )
  }

  if (secretPath) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: '#f4f6f8',
        }}
      >
        <Box sx={{ width: 500, p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: 3 }}>
          
          {loading && <Typography>Loading...</Typography>}
          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
          {plan && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {isNameEditing ? (
                  <TextField
                    fullWidth
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleNameBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur()
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <Typography variant='h5' component='h1' sx={{ flexGrow: 1 }}>
                    {plan.name}
                  </Typography>
                )}
                {!isNameEditing && (
                  <IconButton size='small' onClick={() => setIsNameEditing(true)}>
                    <span style={{ fontSize: 18 }}>✏️</span>
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mr: 1 }}>
                  Editors URL:
                </Typography>
                <Tooltip title="Only share this with editors — do not lose this URL or you won't be able to edit your plan.">
                  <Typography
                    component='a'
                    href={window.location.href}
                    variant='body2'
                    sx={{ wordBreak: 'break-all', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {window.location.href}
                  </Typography>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant='body2' color='text.secondary' sx={{ mr: 1 }}>
                  Viewer URL:
                </Typography>
                <Typography variant='body2' sx={{ wordBreak: 'break-all' }}>
                  {plan.viewSecret ? `${window.location.origin}/view/${plan.viewSecret}` : ''}
                </Typography>
                <Button size='small' onClick={() => copyToClipboard(plan.viewSecret ? `${window.location.origin}/view/${plan.viewSecret}` : window.location.href)}>Copy</Button>
              </Box>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id='plan-timezone-label'>Plan time zone</InputLabel>
                <Select
                  labelId='plan-timezone-label'
                  label='Plan time zone'
                  value={plan.timezone || browserTimeZone}
                  onChange={handleTimezoneChange}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                >
                  {timeZones.map((timezone) => (
                    <MenuItem key={timezone} value={timezone}>
                      {timezone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)}>
                <Tab label='Activities' />
                <Tab label='Itinerary' />
                <Tab label='Today' />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
                  <Button variant='outlined' fullWidth onClick={() => openActivityDialog()}>
                    Add Activity
                  </Button>
                </Stack>
                {renderActivities()}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
                  <Button variant='outlined' fullWidth onClick={() => openEventDialog()}>
                    Add Event
                  </Button>
                </Stack>
                {renderEvents()}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderToday()}
              </TabPanel>

              <Divider sx={{ my: 2 }} />
            </>
          )}
        </Box>

        <Dialog open={activityDialogOpen} onClose={closeActivityDialog} fullWidth>
          <DialogTitle>{editingActivityId ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label='Name'
                value={activityForm.name}
                required
                onChange={(e) => setActivityForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <TextField
                label='Description'
                value={activityForm.description}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <TextField
                label='Address'
                value={activityForm.address}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, address: e.target.value }))}
                fullWidth
              />
              <Stack direction='row' spacing={1} alignItems='flex-end'>
                <TextField
                  label='Latitude'
                  type='number'
                  value={activityForm.locationLat}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLat: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label='Longitude'
                  type='number'
                  value={activityForm.locationLng}
                  onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLng: e.target.value }))}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant='outlined'
                  onClick={handleAddressSuggest}
                  disabled={activityLookupLoading || !activityForm.address.trim()}
                >
                  {activityLookupLoading ? 'Looking up…' : 'Suggest'}
                </Button>
              </Stack>
              <TextField
                label='Duration'
                value={activityForm.duration}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, duration: e.target.value }))}
                disabled={!!viewPath}
              />
              <TextField
                label='Suggested Start'
                type='datetime-local'
                value={activityForm.suggestedStart}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedStart: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={!!viewPath}
              />
              <TextField
                label='Suggested End'
                type='datetime-local'
                value={activityForm.suggestedEnd}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedEnd: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                disabled={!!viewPath}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            {viewPath ? (
              <Box />
            ) : editingActivityId ? (
              <Button color='error' onClick={handleDeleteActivity} disabled={loading}>
                Delete
              </Button>
            ) : <Box />}
            <Box>
              <Button onClick={closeActivityDialog}>Close</Button>
              {!viewPath && (
                <Button onClick={handleSaveActivity} variant='contained' disabled={loading}>
                  {editingActivityId ? 'Save Activity' : 'Add Activity'}
                </Button>
              )}
            </Box>
          </DialogActions>
        </Dialog>

        <Dialog open={eventDialogOpen} onClose={closeEventDialog} fullWidth>
          <DialogTitle>{viewPath ? 'View Event' : editingEventId ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogContent>
            {viewPath && selectedEvent ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography variant='subtitle1'>Activity</Typography>
                <Typography><strong>Name:</strong> {selectedEvent.activity?.name || '-'}</Typography>
                <Typography><strong>Description:</strong> {selectedEvent.activity?.description || '-'}</Typography>
                <Typography><strong>Address:</strong> {selectedEvent.activity?.address || '-'}</Typography>
                <Typography><strong>Duration:</strong> {selectedEvent.activity?.duration || '-'}</Typography>
                <Typography><strong>Suggested Start:</strong> {selectedEvent.activity?.suggestedStart ? formatPlanDateTime(selectedEvent.activity.suggestedStart) : '-'}</Typography>
                <Typography><strong>Suggested End:</strong> {selectedEvent.activity?.suggestedEnd ? formatPlanDateTime(selectedEvent.activity.suggestedEnd) : '-'}</Typography>
                {(selectedEvent.activity?.location?.lat !== undefined && selectedEvent.activity?.location?.lng !== undefined) && (
                  <Box sx={{ width: '100%', height: 180 }}>
                    <MapContainer
                      center={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]} />
                    </MapContainer>
                  </Box>
                )}
                <Divider />
                <Typography variant='subtitle1'>Event</Typography>
                <Typography><strong>Start:</strong> {selectedEvent.start ? formatPlanDateTime(selectedEvent.start) : '-'}</Typography>
                <Typography><strong>End:</strong> {selectedEvent.end ? formatPlanDateTime(selectedEvent.end) : '-'}</Typography>
              </Stack>
            ) : (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <FormControl fullWidth>
                  <InputLabel id='event-activity-label'>Select Activity</InputLabel>
                  <Select
                    labelId='event-activity-label'
                    label='Select Activity'
                    value={eventForm.activityId}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, activityId: e.target.value }))}
                    disabled={!!viewPath}
                  >
                    {plan?.activities?.length ? (
                      plan.activities.map((activity) => (
                        <MenuItem key={String(activity._id || activity.name)} value={String(activity._id)}>
                          {activity.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value='' disabled>
                        No saved activities yet
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  label='Event Start'
                  type='datetime-local'
                  value={eventForm.start}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={!!viewPath}
                />
                <TextField
                  label='Event End'
                  type='datetime-local'
                  value={eventForm.end}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  disabled={!!viewPath}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            {viewPath ? (
              <Box />
            ) : editingEventId ? (
              <Button color='error' onClick={handleDeleteEvent} disabled={loading}>
                Delete
              </Button>
            ) : <Box />}
            <Box>
              <Button onClick={closeEventDialog}>Close</Button>
              {!viewPath && (
                <Button onClick={handleSaveEvent} variant='contained' disabled={loading}>
                  {editingEventId ? 'Save Event' : 'Add Event'}
                </Button>
              )}
            </Box>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f4f6f8',
        p: 2,
      }}
    >
      <Box sx={{ width: 400, p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: 3 }}>
        <Typography variant='h4' mb={2} textAlign='center'>
          Create a New Plan
        </Typography>
        <TextField
          fullWidth
          label='Plan name'
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          sx={{ mb: 2 }}
        />
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
        <Button variant='contained' fullWidth onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating…' : 'Create Plan'}
        </Button>
      </Box>
    </Box>
  )
}
