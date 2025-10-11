import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Server, 
  User, 
  Key, 
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { cn } from '../../../lib/utils';

const CONNECTION_STATUS = {
  disconnected: { color: 'secondary', icon: AlertCircle, text: 'Not Connected' },
  connecting: { color: 'warning', icon: RefreshCw, text: 'Connecting...' },
  connected: { color: 'success', icon: CheckCircle2, text: 'Connected' },
  error: { color: 'destructive', icon: AlertCircle, text: 'Connection Failed' }
};

export function ConfigurationPanel({ 
  config = {}, 
  onConfigChange, 
  onTestConnection,
  onSaveConfig,
  connectionStatus = 'disconnected',
  availableProjects = [],
  isLoading = false 
}) {
  const [localConfig, setLocalConfig] = useState({
    url: '',
    email: '',
    token: '',
    projectKey: '',
    assignee: '',
    fixVersion: '',
    sprint: '',
    ...config
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleTestConnection = async () => {
    await onTestConnection?.(localConfig);
  };

  const handleSaveConfig = () => {
    onSaveConfig?.(localConfig);
  };

  const statusConfig = CONNECTION_STATUS[connectionStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </div>
          <Badge 
            variant={statusConfig.color}
            className="flex items-center gap-1"
          >
            <StatusIcon className={cn(
              "h-3 w-3",
              connectionStatus === 'connecting' && "animate-spin"
            )} />
            {statusConfig.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            Jira Connection
          </h3>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="jira-url">Jira URL</Label>
              <Input
                id="jira-url"
                placeholder="https://yourcompany.atlassian.net"
                value={localConfig.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={localConfig.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="token">API Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Your API token"
                  value={localConfig.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={!localConfig.url || !localConfig.email || !localConfig.token || isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                connectionStatus === 'connecting' && "animate-spin"
              )} />
              Test Connection
            </Button>
            
            <Button
              onClick={handleSaveConfig}
              disabled={connectionStatus !== 'connected'}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Config
            </Button>
          </div>
        </div>

        <Separator />

        {/* Project Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Project Settings
          </h3>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              {availableProjects.length > 0 ? (
                <Select
                  value={localConfig.projectKey}
                  onValueChange={(value) => handleInputChange('projectKey', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.key} value={project.key}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-muted px-1 rounded">
                            {project.key}
                          </span>
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="project"
                  placeholder="Project key (e.g., MP, PROJ)"
                  value={localConfig.projectKey}
                  onChange={(e) => handleInputChange('projectKey', e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Default Values */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Default Values
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>
          
          <motion.div
            initial={false}
            animate={{ height: showAdvanced ? 'auto' : 0, opacity: showAdvanced ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Default Assignee</Label>
                  <Input
                    id="assignee"
                    placeholder="username or email"
                    value={localConfig.assignee}
                    onChange={(e) => handleInputChange('assignee', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sprint">Default Sprint</Label>
                  <Input
                    id="sprint"
                    placeholder="Sprint name"
                    value={localConfig.sprint}
                    onChange={(e) => handleInputChange('sprint', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fixVersion">Fix Version</Label>
                <Input
                  id="fixVersion"
                  placeholder="Version (e.g., 1.2.0)"
                  value={localConfig.fixVersion}
                  onChange={(e) => handleInputChange('fixVersion', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Help */}
        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connection failed. Please check your credentials and try again.
              Make sure your API token has the necessary permissions.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'disconnected' && (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Need help getting your API token?</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://id.atlassian.com/manage-profile/security/api-tokens', '_blank')}
                >
                  Generate API Token
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
