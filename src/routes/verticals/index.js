const express = require('express')
const router = express.Router()

// get single vertical
router.get('/:id', require('./get'))

// get verticals list
router.get('/', require('./list'))

// save vertical
router.put('/:id', require('./save'))

// create new vertical
router.post('/', require('./create'))

// delete vertical
router.delete('/:id', require('./delete'))

module.exports = router
