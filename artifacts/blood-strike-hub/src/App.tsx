import { Layout } from "@/components/layout";
import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const ScrimsList = lazy(() => import("@/pages/scrims"));
const ScrimDetail = lazy(() => import("@/pages/scrim-detail"));
const TeamsList = lazy(() => import("@/pages/teams"));
const TeamDetail = lazy(() => import("@/pages/team-detail"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const Announcements = lazy(() => import("@/pages/announcements"));
const Profile = lazy(() => import("@/pages/profile"));
const Admin = lazy(() => import("@/pages/admin"));
const NotFound = lazy(() => import("@/pages/not-found"));

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route>
          <Layout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/scrims" component={ScrimsList} />
              <Route path="/scrims/:id" component={ScrimDetail} />
              <Route path="/teams" component={TeamsList} />
              <Route path="/teams/:id" component={TeamDetail} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/announcements" component={Announcements} />
              <Route path="/profile" component={Profile} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        </Route>
      </Switch>
    </Suspense>
  );
}
