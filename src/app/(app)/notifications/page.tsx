"use client";

import { useState } from "react";
import { useMutation, useQuery } from "urql";

import { IconBell } from "@/components/icons";
import { MarkReadDocument, NotificationItem, NotificationListDocument, useOpenNotification } from "@/components/Notifications";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader } from "@/components/ui";
import { errorMessage } from "@/lib/api";

const PAGE = 30;

export default function NotificationsPage() {
  const [shown, setShown] = useState(PAGE);
  const [{ data, error, fetching }, reload] = useQuery({ query: NotificationListDocument, variables: { first: shown } });
  const [, markRead] = useMutation(MarkReadDocument);
  const refresh = () => reload({ requestPolicy: "network-only" });
  const open = useOpenNotification(refresh);

  if (error) return <ErrorNote error={errorMessage(error)} />;
  if (!data) return <Loading shape="list" />;
  const { nodes, pageInfo } = data.notifications;
  const unread = data.unreadNotificationCount;

  return (
    <>
      <PageHeader title="Notifications" subtitle={unread ? `${unread} unread` : "All read"}
        actions={unread ? <Button variant="secondary" onClick={async () => { await markRead({ ids: null }); refresh(); }}>Mark all read</Button> : null} />
      {nodes.length ? (
        <Card flush>
          <div className="divide-y divide-line">
            {nodes.map((n) => <NotificationItem key={n.id} n={n} onOpen={open} />)}
          </div>
          {pageInfo.hasNextPage && (
            <div className="border-t border-line p-3 text-center">
              <Button size="sm" variant="secondary" busy={fetching} onClick={() => setShown(shown + PAGE)}>Show older</Button>
            </div>
          )}
        </Card>
      ) : (
        <Empty title="No notifications yet" icon={<IconBell size={18} />}>
          Leave requests waiting for you and decisions on your own requests appear here, and are emailed to you.
        </Empty>
      )}
    </>
  );
}
