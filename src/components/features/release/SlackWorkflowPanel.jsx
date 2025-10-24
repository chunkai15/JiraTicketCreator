import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Slack, 
  Users, 
  User, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Plus,
  X,
  MessageSquare,
  ExternalLink,
  Play,
  Square,
  Activity,
  Clock,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { cn } from '../../../lib/utils';

export function SlackWorkflowPanel({ 
  releaseData, 
  onWorkflowComplete,
  isVisible = false 
}) {
  const [devAssignment, setDevAssignment] = useState('');
  const [qaAssignments, setQaAssignments] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState(null);
  const [error, setError] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Load existing workflow state if available
  useEffect(() => {
    if (releaseData && releaseData.length > 0) {
      const releaseId = releaseData[0].releaseId;
      const stored = localStorage.getItem(`slack_workflow_${releaseId}`);
      if (stored) {
        try {
          const state = JSON.parse(stored);
          setWorkflowState(state);
          setDevAssignment(state.assignments?.dev || '');
          setQaAssignments(state.assignments?.qa || ['']);
        } catch (error) {
          console.error('Failed to load workflow state:', error);
        }
      }
    }
  }, [releaseData]);

  // Add QA assignment field
  const addQaAssignment = () => {
    setQaAssignments([...qaAssignments, '']);
  };

  // Remove QA assignment field
  const removeQaAssignment = (index) => {
    if (qaAssignments.length > 1) {
      setQaAssignments(qaAssignments.filter((_, i) => i !== index));
    }
  };

  // Update QA assignment
  const updateQaAssignment = (index, value) => {
    const updated = [...qaAssignments];
    updated[index] = value;
    setQaAssignments(updated);
  };

  // Send enhanced notification
  const sendEnhancedNotification = async () => {
    if (!releaseData || releaseData.length === 0) {
      setError('No release data available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { SlackService } = await import('../../../services/slackService');
      
      // Get Slack webhook URL
      const slackWebhook = localStorage.getItem('slack-webhook-url');
      if (!slackWebhook) {
        throw new Error('Slack webhook URL not configured. Please configure it in Settings.');
      }

      // Prepare assignments
      const assignments = {
        dev: devAssignment.trim(),
        qa: qaAssignments.filter(qa => qa.trim()).map(qa => qa.trim())
      };

      // Prepare release data for enhanced notification
      const enhancedReleaseData = {
        selectedReleases: releaseData.map(r => r.releaseId),
        releases: releaseData.map(r => ({
          id: r.releaseId,
          name: r.releaseName
        })),
        pages: releaseData.flatMap(release => [
          {
            title: `${release.releaseName} Release - ${release.releaseDate ? new Date(release.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'TBD'}`,
            url: release.mainPageUrl,
            shortUrl: release.pageUrl,
            type: 'main',
            releaseName: release.releaseName
          },
          {
            title: `Release checklist for the ${release.releaseName}`,
            url: release.checklistPageUrl,
            shortUrl: release.checklistPageUrl,
            type: 'checklist',
            releaseName: release.releaseName
          }
        ])
      };

      console.log('🚀 Sending enhanced Slack notification...');
      console.log('Release data:', enhancedReleaseData);
      console.log('Assignments:', assignments);

      const result = await SlackService.sendEnhancedReleaseNotification(
        slackWebhook, 
        enhancedReleaseData, 
        assignments
      );

      if (result.success) {
        // Store workflow state
        const newWorkflowState = {
          releaseData: enhancedReleaseData,
          assignments,
          status: 'notification_sent',
          timestamp: Date.now()
        };

        setWorkflowState(newWorkflowState);
        
        // Store in localStorage for persistence
        if (releaseData[0]?.releaseId) {
          SlackService.storeWorkflowState(releaseData[0].releaseId, newWorkflowState);
        }

        if (onWorkflowComplete) {
          onWorkflowComplete(newWorkflowState);
        }
      } else {
        throw new Error(result.error || 'Failed to send enhanced notification');
      }

    } catch (error) {
      console.error('Failed to send enhanced notification:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check monitoring status
  const checkMonitoringStatus = async (workflowId) => {
    if (!workflowId) return;
    
    setIsCheckingStatus(true);
    try {
      const { API_BASE_URL } = await import('../../../config/api');
      const response = await fetch(`${API_BASE_URL}/slack/monitoring-status/${workflowId}`);
      const result = await response.json();
      
      if (result.success) {
        setMonitoringStatus(result.status);
      }
    } catch (error) {
      console.error('Failed to check monitoring status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Stop monitoring
  const stopMonitoring = async (workflowId) => {
    if (!workflowId) return;
    
    setIsLoading(true);
    try {
      const { API_BASE_URL } = await import('../../../config/api');
      const response = await fetch(`${API_BASE_URL}/slack/stop-monitoring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMonitoringStatus({ active: false });
        setWorkflowState(prev => ({
          ...prev,
          status: 'monitoring_stopped'
        }));
      } else {
        throw new Error(result.error || 'Failed to stop monitoring');
      }
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check monitoring status when workflow state changes
  useEffect(() => {
    if (workflowState?.workflowId && workflowState.status === 'notification_sent') {
      // Extract workflow ID from stored state or generate from release data
      const workflowId = workflowState.workflowId || `workflow_${Date.now()}`;
      checkMonitoringStatus(workflowId);
      
      // Set up periodic status checks
      const interval = setInterval(() => {
        checkMonitoringStatus(workflowId);
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [workflowState]);

  // Check if form is valid
  const isFormValid = devAssignment.trim() && qaAssignments.some(qa => qa.trim());

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Slack className="h-5 w-5 text-purple-600" />
              Enhanced Slack Workflow
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Set up team assignments and send enhanced notifications with interactive components
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {workflowState && workflowState.status === 'notification_sent' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p className="font-medium">Enhanced notification sent successfully!</p>
                    <div className="text-sm space-y-1">
                      <p>👨‍💻 Dev: {workflowState.assignments.dev}</p>
                      <p>👩‍🔬 QA: {workflowState.assignments.qa.join(', ')}</p>
                    </div>
                    
                    {/* Monitoring Status */}
                    {monitoringStatus && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className={`h-4 w-4 ${monitoringStatus.active ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
                            <span className="font-medium text-sm">
                              {monitoringStatus.active ? 'Auto-monitoring Active' : 'Monitoring Stopped'}
                            </span>
                          </div>
                          {monitoringStatus.active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => stopMonitoring(workflowState.workflowId)}
                              disabled={isLoading}
                              className="h-7 px-2 text-xs"
                            >
                              <Square className="h-3 w-3 mr-1" />
                              Stop
                            </Button>
                          )}
                        </div>
                        
                        {monitoringStatus.active && (
                          <div className="text-xs text-muted-foreground mt-2 space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Running: {monitoringStatus.duration}h
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Scans: {monitoringStatus.stats?.totalScans || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>📋 Threads found: {monitoringStatus.stats?.threadsFound || 0}</span>
                              <span>✅ Checklists sent: {monitoringStatus.stats?.checklistsSent || 0}</span>
                            </div>
                            <p className="text-muted-foreground">
                              🔄 Automatically scanning for new threads every 2 minutes
                            </p>
                          </div>
                        )}
                        
                        {!monitoringStatus.active && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Manual mode: QA team should mention @Everfit QA Toolhub in threads
                          </p>
                        )}
                      </div>
                    )}
                    
                    {isCheckingStatus && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400" />
                        Checking monitoring status...
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Dev Assignment */}
            <div className="space-y-2">
              <Label htmlFor="dev-assignment" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Developer Assignment
              </Label>
              <Input
                id="dev-assignment"
                placeholder="Enter developer name or @username"
                value={devAssignment}
                onChange={(e) => setDevAssignment(e.target.value)}
                disabled={isLoading || workflowState?.status === 'notification_sent'}
              />
              <p className="text-xs text-muted-foreground">
                The developer responsible for this release
              </p>
            </div>

            <Separator />

            {/* QA Assignments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  QA Team Assignments
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addQaAssignment}
                  disabled={isLoading || workflowState?.status === 'notification_sent'}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2">
                {qaAssignments.map((qa, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`QA member ${index + 1} name or @username`}
                      value={qa}
                      onChange={(e) => updateQaAssignment(index, e.target.value)}
                      disabled={isLoading || workflowState?.status === 'notification_sent'}
                    />
                    {qaAssignments.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQaAssignment(index)}
                        disabled={isLoading || workflowState?.status === 'notification_sent'}
                        className="h-10 px-2 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                QA team members who will handle this release
              </p>
            </div>

            <Separator />

            {/* Release Summary */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Release Summary
              </Label>
              <div className="bg-white rounded-lg p-3 border space-y-2">
                {releaseData && releaseData.map((release, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{release.releaseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Pages
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Steps */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Enhanced Automated Workflow:</p>
                  <ol className="text-sm space-y-1 ml-4 list-decimal">
                    <li>Send enhanced notification with team assignments</li>
                    <li>System automatically scans for matching threads every 2 minutes</li>
                    <li>Auto-detects threads with release version + checklist requests</li>
                    <li>Automatically sends checklists to matching threads</li>
                    <li>Prevents duplicate sends with 24-hour protection</li>
                    <li>QA team uses threads for coordination and updates</li>
                  </ol>
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                    <p className="font-medium text-blue-800">🎯 Smart Platform Detection:</p>
                    <p className="text-blue-700">Supports mp-api, payment-api, Marketplace Client/Pro/CMS Web with version matching</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                onClick={sendEnhancedNotification}
                disabled={!isFormValid || isLoading || workflowState?.status === 'notification_sent'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : workflowState?.status === 'notification_sent' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Notification Sent
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Automated Workflow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default SlackWorkflowPanel;
