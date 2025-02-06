import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
));

app.use(express.json({
    limit: '50kb'
}));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

app.use(express.static("public"));

app.use(cookieParser());



// routes import 

import userRouter from './routes/user.routes.js';


// routes declaration

// when the user hit http://localhost:8000/users/ this endpoint then 
// control will activate or go to  router i.e.userRouter and then // http://localhost:8000/users/register 

// as we have seperate routes folder so we have to use middleware .use() to take router
app.use('/api/v1/users', userRouter);
// http://localhost:8000/api/v1/users/register
// export default app;
export { app };  