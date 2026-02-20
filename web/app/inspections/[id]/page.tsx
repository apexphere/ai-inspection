'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { api, InspectionDetail, Finding, ApiError } from '@/lib/api';
import { LoadingPage, ErrorPage, SectionList, FindingEditor } from '@/components';
import { PageLayout, PageHeader, PageContent } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PageProps {
  params: Promise<{ id: string }>;
}

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

export default function InspectionDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  const fetchInspection = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.inspections.get(id);
      setInspection(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Inspection not found');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load inspection');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleGenerateReport = async (): Promise<void> => {
    if (!inspection) return;

    try {
      setGenerating(true);
      const result = await api.reports.generate(inspection.id);
      window.open(result.url, '_blank');
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to generate report: ${err.message}`);
      } else {
        alert('Failed to generate report');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleEditFinding = (finding: Finding): void => {
    setEditingFinding(finding);
  };

  const handleSaveFinding = (updatedFinding: Finding): void => {
    if (!inspection) return;

    setInspection({
      ...inspection,
      findings: inspection.findings.map((f) =>
        f.id === updatedFinding.id ? updatedFinding : f
      ),
    });
    setEditingFinding(null);
  };

  const handleDeleteFinding = (): void => {
    if (!inspection || !editingFinding) return;

    setInspection({
      ...inspection,
      findings: inspection.findings.filter((f) => f.id !== editingFinding.id),
    });
    setEditingFinding(null);
  };

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !inspection) {
    return <ErrorPage message={error || 'Inspection not found'} retry={fetchInspection} />;
  }

  const findingsCount = inspection.findings.length;
  const urgentCount = inspection.findings.filter((f) => f.severity === 'URGENT').length;
  const majorCount = inspection.findings.filter((f) => f.severity === 'MAJOR').length;

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/inspections"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Inspections
        </Link>
      </div>

      <PageHeader
        title={inspection.address}
        description={
          <>
            Client: {inspection.clientName}
            {inspection.inspectorName && ` • Inspector: ${inspection.inspectorName}`}
          </>
        }
        actions={
          <Badge variant={getStatusBadgeVariant(inspection.status)}>
            {formatStatus(inspection.status)}
          </Badge>
        }
      />

      <PageContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Findings - Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-medium text-foreground">Findings</h2>
            <SectionList
              findings={inspection.findings}
              onEditFinding={handleEditFinding}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleGenerateReport}
                  disabled={generating || inspection.status !== 'COMPLETED'}
                  className="w-full"
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
                {inspection.status !== 'COMPLETED' && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete the inspection to generate a report
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Findings</dt>
                    <dd className="font-medium text-foreground">{findingsCount}</dd>
                  </div>
                  {urgentCount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-destructive">Urgent</dt>
                      <dd className="font-medium text-destructive">{urgentCount}</dd>
                    </div>
                  )}
                  {majorCount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-yellow-600">Major</dt>
                      <dd className="font-medium text-yellow-600">{majorCount}</dd>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Current Section</dt>
                    <dd className="font-medium text-foreground capitalize">
                      {inspection.currentSection.replace(/-/g, ' ')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Checklist</dt>
                    <dd className="text-foreground">{inspection.checklistId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="text-foreground">
                      {new Date(inspection.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="text-foreground">
                      {new Date(inspection.updatedAt).toLocaleDateString()}
                    </dd>
                  </div>
                  {inspection.completedAt && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd className="text-foreground">
                        {new Date(inspection.completedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContent>

      {/* Finding Editor Modal */}
      {editingFinding && (
        <FindingEditor
          finding={editingFinding}
          inspectionId={id}
          onSave={handleSaveFinding}
          onDelete={handleDeleteFinding}
          onCancel={() => setEditingFinding(null)}
        />
      )}
    </PageLayout>
  );
}
