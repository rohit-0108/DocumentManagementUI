import { useQuery } from '@tanstack/react-query';
import {
  Activity, CheckCircle2, Clock, Database, FileText, TrendingUp, Users, XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { dashboardApi, extractErrorMessage } from '@/api';
import { EmptyState, ErrorState } from '@/components/common';
import {
  Badge, Button, Card, CardContent, CardDescription, CardHeader,
  CardSkeleton, CardTitle, Select, Skeleton,
} from '@/components/ui';
import { POLL_INTERVAL_MS } from '@/lib/constants';
import { formatRelative, getInitials } from '@/lib/utils';

const CHART_COLOURS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  tone: 'primary' | 'warning' | 'success' | 'destructive' | 'muted';
  hint?: string;
  to?: string;
}

const tones = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/15 text-warning-foreground',
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/15 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

function StatCard({ label, value, Icon, tone, hint, to }: StatCardProps) {
  const content = (
    <Card className={to ? 'transition-shadow hover:shadow-md' : ''}>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(30);

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard', 'stats', trendDays],
    queryFn: () => dashboardApi.getStats(trendDays),
    refetchInterval: POLL_INTERVAL_MS,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message={extractErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const approvalRate =
    data.approvedCount + data.rejectedCount > 0
      ? Math.round((data.approvedCount / (data.approvedCount + data.rejectedCount)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview • updated {formatRelative(new Date(dataUpdatedAt).toISOString())}
          </p>
        </div>

        <Select
          value={trendDays}
          onChange={(e) => setTrendDays(Number(e.target.value))}
          className="w-44"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total documents"
          value={data.totalDocuments}
          Icon={FileText}
          tone="primary"
          hint={`${data.totalStorageFormatted} stored`}
          to="/documents"
        />
        <StatCard
          label="Pending approval"
          value={data.pendingCount}
          Icon={Clock}
          tone="warning"
          hint="Awaiting review"
          to="/approvals"
        />
        <StatCard
          label="Approved"
          value={data.approvedCount}
          Icon={CheckCircle2}
          tone="success"
          hint={`${approvalRate}% approval rate`}
        />
        <StatCard
          label="Rejected"
          value={data.rejectedCount}
          Icon={XCircle}
          tone="destructive"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={data.totalUsers} Icon={Users} tone="muted" to="/admin/users" />
        <StatCard label="Active users" value={data.activeUsers} Icon={Users} tone="success" />
        <StatCard label="Storage used" value={data.totalStorageFormatted} Icon={Database} tone="muted" />
        <StatCard
          label="Departments"
          value={data.documentsByDepartment.length}
          Icon={TrendingUp}
          tone="primary"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documents by department</CardTitle>
            <CardDescription>Breakdown across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            {data.documentsByDepartment.length === 0 ? (
              <EmptyState title="No data yet" description="Upload documents to see the breakdown." />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.documentsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="count" name="Documents" radius={[6, 6, 0, 0]}>
                    {data.documentsByDepartment.map((_, index) => (
                      <Cell key={index} fill={CHART_COLOURS[index % CHART_COLOURS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload trend</CardTitle>
            <CardDescription>Uploads over the last {trendDays} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(0, Math.floor(data.uploadTrend.length / 8))}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Uploads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top uploaders + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top uploaders</CardTitle>
            <CardDescription>By document count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topUploaders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No uploads yet.</p>
            ) : (
              data.topUploaders.map((uploader, index) => (
                <div key={uploader.userId} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {getInitials(uploader.fullName ?? uploader.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {uploader.fullName ?? uploader.username}
                    </p>
                    <p className="text-xs text-muted-foreground">@{uploader.username}</p>
                  </div>
                  <Badge variant="secondary">{uploader.documentCount}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Recent activity
              </CardTitle>
              <CardDescription>Live audit feed, last 20 entries</CardDescription>
            </div>
            <Link to="/admin/audit-logs">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="max-h-[340px] space-y-1 overflow-y-auto">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              data.recentActivity.map((entry) => (
                <div
                  key={entry.logId}
                  className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      entry.isSuccess ? 'bg-success' : 'bg-destructive'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{entry.action}</span>
                      {entry.username && (
                        <span className="text-muted-foreground"> by {entry.username}</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.httpMethod} {entry.endpoint}
                      {entry.statusCode && ` • ${entry.statusCode}`}
                      {entry.durationMs != null && ` • ${entry.durationMs}ms`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(entry.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}