const userRouter = require('./userRouter')
const matchRouter = require('./userRouter')

const route = app => {
    app.use('/api/user', userRouter)
    app.use('/api/match', matchRouter)
}

module.exports = route