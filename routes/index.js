const userRouter = require('./userRouter');
const matchRouter = require('./matchRouter');

const route = (app) => {
    app.use('/api/user', userRouter);
    app.use('/api/match', matchRouter);
};

module.exports = route;
