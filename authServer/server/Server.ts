import AuthController from "../controller/AuthController";

const PORT: number = Number(process.env.PORT) || 8000;
const app = AuthController.createExpressApp();
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));