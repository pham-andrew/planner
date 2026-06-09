const Obj = require('./obj.model')
const router = require('express').Router()

router.route('/create').post((req, res) => {
    const newObj = new Obj(req.body)
    newObj.save()
        .then(obj => res.json(obj))
        .catch(err => res.status(400).json("Error! " + err))
})

router.get("/", async (req, res) => {
    const data = await Obj.find();
    res.send({ data: data });
});

router.delete("/", async (req, res) => {
    const deletedDocument = await Obj.deleteOne({_id: req.body.id,});
    res.send(deletedDocument);
});

router.patch("/", async (req, res) => {
    const result = await Obj.updateOne({ _id: req.body.id }, { $set: { text: req.body.text } });
    res.status(200).send({
        data: result,
    });
});

module.exports = router