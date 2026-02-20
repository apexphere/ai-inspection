'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Inspection, ApiError } from '@/lib/api';
import { LoadingPage, ErrorPage } from '@/components';
import { PageLayout, PageHeader, PageContent } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function getStatusBadgeVariant(status: string): "default" | "secondary" | "success" | "warning" | "destructive" {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return 'success';
    case 'in_progress':
    case 'active':
      return 'warning';
    case 'draft':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function InspectionsPage(): React.ReactElement {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.inspections.list();
      setInspections(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load inspections');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage message={error} retry={fetchInspections} />;
  }

  return (
    <PageLayout>
      <PageHeader
        title="Inspections"
        description="Manage your property inspections"
        actions={
          <Button asChild>
            <Link href="/inspections/new">+ New Inspection</Link>
          </Button>
        }
      />

      <PageContent>
        {inspections.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No inspections yet</p>
            <Link
              href="/inspections/new"
              className="text-primary hover:underline font-medium"
            >
              Create your first inspection
            </Link>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Address</TableHead>
                  <TableHead className="w-[25%]">Client</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[15%]">Created</TableHead>
                  <TableHead className="w-[15%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell className="font-medium">
                      {inspection.address}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inspection.clientName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(inspection.status)}>
                        {formatStatus(inspection.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(inspection.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/inspections/${inspection.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </PageContent>
    </PageLayout>
  );
}
