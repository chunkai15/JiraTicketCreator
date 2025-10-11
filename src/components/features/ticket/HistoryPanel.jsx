import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Clock, 
  FileText, 
  Copy, 
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Alert, AlertDescription } from '../../ui/alert';
import { cn, formatRelativeTime } from '../../../lib/utils';

const MOCK_HISTORY = [
  {
    id: '1',
    type: 'ticket_created',
    title: 'Login Bug - Mobile App',
    ticketKey: 'MP-1234',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    status: 'success',
    url: 'https://company.atlassian.net/browse/MP-1234'
  },
  {
    id: '2',
    type: 'ticket_created',
    title: 'Dark Mode Feature',
    ticketKey: 'MP-1233',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    status: 'success',
    url: 'https://company.atlassian.net/browse/MP-1233'
  },
  {
    id: '3',
    type: 'bulk_created',
    title: 'Bulk Import - 5 tickets',
    count: 5,
    timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    status: 'success',
    tickets: ['MP-1229', 'MP-1230', 'MP-1231', 'MP-1232', 'MP-1233']
  },
  {
    id: '4',
    type: 'ticket_failed',
    title: 'Performance Issue',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    status: 'failed',
    error: 'Authentication failed'
  },
  {
    id: '5',
    type: 'template_used',
    title: 'Bug Report Template',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'info'
  }
];

const ACTIVITY_TYPES = {
  ticket_created: { icon: FileText, color: 'success', label: 'Ticket Created' },
  bulk_created: { icon: FileText, color: 'success', label: 'Bulk Created' },
  ticket_failed: { icon: FileText, color: 'destructive', label: 'Creation Failed' },
  template_used: { icon: Copy, color: 'secondary', label: 'Template Used' }
};

export function HistoryPanel({ 
  history = MOCK_HISTORY, 
  onReuse, 
  onClear,
  isLoading = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.ticketKey?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const groupedHistory = groupByDate(filteredHistory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
            <Badge variant="outline">
              {history.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span className="text-muted-foreground">Loading history...</span>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <Alert>
            <History className="h-4 w-4" />
            <AlertDescription>
              {searchTerm ? 'No matching history found.' : 'No recent activity. Create some tickets to see history here.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{date}</span>
                  <Separator className="flex-1" />
                </div>
                
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <HistoryItem
                          item={item}
                          onReuse={() => onReuse?.(item)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryItem({ item, onReuse }) {
  const config = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.ticket_created;
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
      "hover:bg-muted/50 cursor-pointer"
    )}>
      <div className={cn(
        "p-2 rounded-full",
        config.color === 'success' && "bg-success-100 text-success-600",
        config.color === 'destructive' && "bg-destructive-100 text-destructive-600",
        config.color === 'secondary' && "bg-secondary text-secondary-foreground"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm truncate">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={config.color} className="text-xs">
                {config.label}
              </Badge>
              {item.ticketKey && (
                <Badge variant="outline" className="text-xs font-mono">
                  {item.ticketKey}
                </Badge>
              )}
              {item.count && (
                <Badge variant="outline" className="text-xs">
                  {item.count} tickets
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(item.timestamp)}
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            {item.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(item.url, '_blank');
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReuse();
              }}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {item.error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription className="text-xs">
              {item.error}
            </AlertDescription>
          </Alert>
        )}
        
        {item.tickets && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-1">Created tickets:</p>
            <div className="flex flex-wrap gap-1">
              {item.tickets.slice(0, 3).map((ticket) => (
                <Badge key={ticket} variant="outline" className="text-xs font-mono">
                  {ticket}
                </Badge>
              ))}
              {item.tickets.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tickets.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDate(history) {
  const groups = {};
  const now = new Date();
  
  history.forEach(item => {
    const itemDate = new Date(item.timestamp);
    const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
    
    let dateKey;
    if (diffDays === 0) {
      dateKey = 'Today';
    } else if (diffDays === 1) {
      dateKey = 'Yesterday';
    } else if (diffDays < 7) {
      dateKey = `${diffDays} days ago`;
    } else {
      dateKey = itemDate.toLocaleDateString();
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });
  
  return groups;
}
