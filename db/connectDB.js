import mongoose from 'mongoose';

const connect = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            // to avoid warnings in console
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true
        });
    } catch (error) {
        console.error(`Error :  ${error.message}`);
        process.exit(1);
    }
}

export default connect;