import React from 'react';
import { Settings, CheckCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import ConfigService from '../../../services/configService';

export function ConfigurationStatusPanel({ jiraConfig, connectionStatus, onRefreshMetadata }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'connecting':
        return <Badge variant="outline" className="text-blue-600"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Connecting...</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Not configured</Badge>;
    }
  };

  const hasValidConfig = jiraConfig.url && jiraConfig.email && jiraConfig.token && jiraConfig.projectKey;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Status
          </CardTitle>
          <CardDescription>
            Current Jira connection status and configuration overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Connection Status</h4>
              <div className="flex items-center gap-2">
                {getStatusBadge(connectionStatus)}
                {connectionStatus === 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefreshMetadata}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh Metadata
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Project Information</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Project: <span className="font-medium">{jiraConfig.projectKey || 'Not set'}</span></p>
                <p>URL: <span className="font-medium">{jiraConfig.url ? jiraConfig.url.replace('https://', '') : 'Not set'}</span></p>
                <p>Email: <span className="font-medium">{jiraConfig.email ? jiraConfig.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not set'}</span></p>
              </div>
            </div>
          </div>

          {!hasValidConfig && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Jira configuration is incomplete. Please configure your connection in the{' '}
                <a href="/settings" className="underline inline-flex items-center gap-1">
                  Settings page
                  <ExternalLink className="h-3 w-3" />
                </a>{' '}
                first.
              </AlertDescription>
            </Alert>
          )}

          {hasValidConfig && connectionStatus === 'disconnected' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configuration found but not connected. The connection will be established automatically when you use Jira features.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Successfully connected to Jira. You can now proceed to configure ticket metadata and create tickets.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
