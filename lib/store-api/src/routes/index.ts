import { Router, type IRouter } from "express";
import checkoutRouter from "./checkout";
import healthRouter from "./health";
import storeRouter from "./store";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storeRouter);
router.use(checkoutRouter);

export default router;
