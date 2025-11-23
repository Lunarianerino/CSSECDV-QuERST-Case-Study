import { getSecurityLogsAction } from "@/lib/actions/securityLogActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SecurityLogsPage() {
  const res = await getSecurityLogsAction(200);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Security Logs</CardTitle>
            {!res.success && (
              <p className="text-sm text-muted-foreground">
                {res.error ?? "Unable to load logs"}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Time</TableHead>
                    <TableHead className="w-[140px]">Event</TableHead>
                    <TableHead className="w-[100px]">Outcome</TableHead>
                    <TableHead className="w-[160px]">User</TableHead>
                    <TableHead className="w-[140px]">Resource</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {res.success && res.data && res.data.length > 0 ? (
                    res.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{log.event}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.outcome === "success" ? "secondary" : "destructive"}
                            className="flex items-center gap-1 w-full"
                          >
                            {log.outcome === "success" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {log.outcome}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.userId ? (
                            <Link href={`/admin/users/${log.userId}`} className="underline">
                              {log.userId}
                            </Link>
                          ) : (
                            log.actorEmail || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{log.resource ?? "-"}</TableCell>
                        <TableCell className="text-xs">
                          {log.message ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        No logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
