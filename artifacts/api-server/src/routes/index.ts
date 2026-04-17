import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import teamsRouter from "./teams";
import scrimsRouter from "./scrims";
import matchesRouter from "./matches";
import violationsRouter from "./violations";
import announcementsRouter from "./announcements";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(teamsRouter);
router.use(scrimsRouter);
router.use(matchesRouter);
router.use(violationsRouter);
router.use(announcementsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);

export default router;
