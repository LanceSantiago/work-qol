import { onRequestGet as __api_github_prs_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\github\\prs.ts"
import { onRequestGet as __api_pagerduty_incidents_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\pagerduty\\incidents.ts"
import { onRequestGet as __api_pagerduty_oncall_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\pagerduty\\oncall.ts"
import { onRequestGet as __api_sentry_issues_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\sentry\\issues.ts"
import { onRequestDelete as __api_places__id__ts_onRequestDelete } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\places\\[id].ts"
import { onRequestPatch as __api_places__id__ts_onRequestPatch } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\places\\[id].ts"
import { onRequestGet as __api_claude_stats_index_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\claude-stats\\index.ts"
import { onRequestPost as __api_claude_stats_index_ts_onRequestPost } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\claude-stats\\index.ts"
import { onRequestGet as __api_places_index_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\places\\index.ts"
import { onRequestPost as __api_places_index_ts_onRequestPost } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\places\\index.ts"
import { onRequestGet as __api_standup_index_ts_onRequestGet } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\standup\\index.ts"
import { onRequestPost as __api_standup_index_ts_onRequestPost } from "C:\\Users\\lance\\Desktop\\Side Projects\\work-qol\\functions\\api\\standup\\index.ts"

export const routes = [
    {
      routePath: "/api/github/prs",
      mountPath: "/api/github",
      method: "GET",
      middlewares: [],
      modules: [__api_github_prs_ts_onRequestGet],
    },
  {
      routePath: "/api/pagerduty/incidents",
      mountPath: "/api/pagerduty",
      method: "GET",
      middlewares: [],
      modules: [__api_pagerduty_incidents_ts_onRequestGet],
    },
  {
      routePath: "/api/pagerduty/oncall",
      mountPath: "/api/pagerduty",
      method: "GET",
      middlewares: [],
      modules: [__api_pagerduty_oncall_ts_onRequestGet],
    },
  {
      routePath: "/api/sentry/issues",
      mountPath: "/api/sentry",
      method: "GET",
      middlewares: [],
      modules: [__api_sentry_issues_ts_onRequestGet],
    },
  {
      routePath: "/api/places/:id",
      mountPath: "/api/places",
      method: "DELETE",
      middlewares: [],
      modules: [__api_places__id__ts_onRequestDelete],
    },
  {
      routePath: "/api/places/:id",
      mountPath: "/api/places",
      method: "PATCH",
      middlewares: [],
      modules: [__api_places__id__ts_onRequestPatch],
    },
  {
      routePath: "/api/claude-stats",
      mountPath: "/api/claude-stats",
      method: "GET",
      middlewares: [],
      modules: [__api_claude_stats_index_ts_onRequestGet],
    },
  {
      routePath: "/api/claude-stats",
      mountPath: "/api/claude-stats",
      method: "POST",
      middlewares: [],
      modules: [__api_claude_stats_index_ts_onRequestPost],
    },
  {
      routePath: "/api/places",
      mountPath: "/api/places",
      method: "GET",
      middlewares: [],
      modules: [__api_places_index_ts_onRequestGet],
    },
  {
      routePath: "/api/places",
      mountPath: "/api/places",
      method: "POST",
      middlewares: [],
      modules: [__api_places_index_ts_onRequestPost],
    },
  {
      routePath: "/api/standup",
      mountPath: "/api/standup",
      method: "GET",
      middlewares: [],
      modules: [__api_standup_index_ts_onRequestGet],
    },
  {
      routePath: "/api/standup",
      mountPath: "/api/standup",
      method: "POST",
      middlewares: [],
      modules: [__api_standup_index_ts_onRequestPost],
    },
  ]