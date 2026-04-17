import { Layout } from "@/components/layout";
import { Switch, Route } from "wouter";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ScrimsList from "@/pages/scrims";
import ScrimDetail from "@/pages/scrim-detail";
import TeamsList from "@/pages/teams";
import TeamDetail from "@/pages/team-detail";
import Leaderboard from "@/pages/leaderboard";
import Announcements from "@/pages/announcements";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
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
  );
}
