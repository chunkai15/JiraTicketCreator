import React from 'react';
import { Zap, RefreshCw, Users, GitBranch, Tag, Folder } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Combobox } from '../../ui/combobox';
import { Alert, AlertDescription } from '../../ui/alert';
import { Skeleton } from '../../ui/skeleton';
import SearchableEpicCombobox from './SearchableEpicCombobox';

export function MetadataPanel({ 
  projectMetadata, 
  defaultMetadata, 
  onDefaultMetadataChange,
  onRefresh,
  jiraConfig
}) {
  const { sprints, versions, assignees, epics, loading } = projectMetadata;

  const handleMetadataChange = (field, value) => {
    // Convert __none__ back to empty string for storage
    const actualValue = value === '__none__' ? '' : value;
    onDefaultMetadataChange(prev => ({
      ...prev,
      [field]: actualValue
    }));
  };

  const getMetadataStats = () => {
    return [
      { label: 'Sprints', count: sprints.length, icon: GitBranch },
      { label: 'Versions', count: versions.length, icon: Tag },
      { label: 'Assignees', count: assignees.length, icon: Users },
      { label: 'Epics', count: epics.length, icon: Folder }
    ];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Ticket Metadata
              </CardTitle>
              <CardDescription>
                Configure default values for new tickets. These will be applied to all created tickets.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getMetadataStats().map(({ label, count, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 p-3 border rounded-lg">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sprint Selection */}
              <div className="space-y-2">
                <Label htmlFor="default-sprint">Default Sprint</Label>
                <Select
                  value={defaultMetadata.sprint || '__none__'}
                  onValueChange={(value) => handleMetadataChange('sprint', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Sprint</SelectItem>
                    {sprints.map((sprint) => (
                      <SelectItem key={sprint.name} value={sprint.name}>
                        <div className="flex items-center gap-2">
                          <span>{sprint.name}</span>
                          {sprint.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              sprint.state === 'active' ? 'text-green-600' : 
                              sprint.state === 'future' ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          >
                            {sprint.state}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {sprints.length > 0 ? `${sprints.length} sprints available` : 'No sprints found'}
                </p>
              </div>

              {/* Fix Version Selection */}
              <div className="space-y-2">
                <Label htmlFor="default-version">Default Fix Version</Label>
                <Combobox
                  options={[
                    { value: '__none__', label: 'No Version', description: 'No fix version assigned' },
                    ...versions
                      .filter(version => !version.released) // Only unreleased versions
                      .map(version => ({
                        value: version.name,
                        label: version.name,
                        description: version.isDefault ? 'Default version' : 
                                   version.archived ? 'Archived' : 'Active version'
                      }))
                  ]}
                  value={defaultMetadata.fixVersion || '__none__'}
                  onValueChange={(value) => handleMetadataChange('fixVersion', value)}
                  placeholder="Select default version"
                  searchPlaceholder="Search versions..."
                  emptyText="No unreleased versions found"
                />
                <p className="text-xs text-muted-foreground">
                  {versions.filter(v => !v.released).length > 0 ? 
                    `${versions.filter(v => !v.released).length} unreleased versions available` : 
                    'No unreleased versions found'}
                </p>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <Label htmlFor="default-assignee">Default Assignee</Label>
                <Combobox
                  options={[
                    { value: '__none__', label: 'Unassigned', description: 'No assignee' },
                    ...assignees.map(assignee => ({
                      value: assignee.accountId,
                      label: assignee.displayName,
                      description: assignee.emailAddress
                    }))
                  ]}
                  value={defaultMetadata.assignee || '__none__'}
                  onValueChange={(value) => handleMetadataChange('assignee', value)}
                  placeholder="Select default assignee"
                  searchPlaceholder="Search users..."
                  emptyText="No users found"
                />
                <p className="text-xs text-muted-foreground">
                  {assignees.length > 0 ? `${assignees.length} users available` : 'No assignees found'}
                </p>
              </div>

              {/* Parent Epic Selection - Searchable */}
              <div className="space-y-2">
                <Label htmlFor="default-parent">Default Parent (Epic)</Label>
                <SearchableEpicCombobox
                  value={defaultMetadata.parent || '__none__'}
                  onChange={(value) => handleMetadataChange('parent', value)}
                  jiraConfig={jiraConfig}
                  placeholder="Search epics..."
                  emptyText="No epics found"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Search for epics by typing keywords, or leave empty to see recent epics
                </p>
              </div>
            </div>
          )}

          {!loading && (sprints.length === 0 && versions.length === 0 && assignees.length === 0) && (
            <Alert>
              <AlertDescription>
                No metadata found. Click "Refresh" to load project data, or check your Jira configuration.
              </AlertDescription>
            </Alert>
          )}

          {!loading && (sprints.length > 0 || versions.length > 0 || assignees.length > 0) && (
            <Alert>
              <AlertDescription>
                ✅ Metadata loaded successfully. These default values will be applied to new tickets unless overridden.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
