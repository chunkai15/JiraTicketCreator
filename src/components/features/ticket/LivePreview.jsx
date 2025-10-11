import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  FileText, 
  User, 
  Calendar, 
  Flag, 
  Tag,
  Paperclip,
  Edit3,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { Alert, AlertDescription } from '../../ui/alert';
import { cn } from '../../../lib/utils';

const PRIORITY_COLORS = {
  'Highest': 'destructive',
  'High': 'destructive',
  'Medium': 'warning',
  'Low': 'secondary',
  'Lowest': 'secondary'
};

const TYPE_COLORS = {
  'Bug': 'destructive',
  'Feature': 'default',
  'Task': 'secondary',
  'Story': 'default',
  'Epic': 'default'
};

export function LivePreview({ 
  tickets = [], 
  onTicketEdit, 
  onTicketDelete, 
  onTicketToggle,
  isLoading = false 
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-muted-foreground">Parsing tickets...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Enter ticket information in the input tab to see live preview here.
              The preview will update automatically as you type.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Live Preview
            <Badge variant="outline">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {tickets.filter(t => t.selected).length} selected
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <TicketPreviewCard
                  ticket={ticket}
                  onEdit={() => onTicketEdit?.(ticket)}
                  onDelete={() => onTicketDelete?.(ticket)}
                  onToggle={() => onTicketToggle?.(ticket)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketPreviewCard({ ticket, onEdit, onDelete, onToggle }) {
  const priorityColor = PRIORITY_COLORS[ticket.priority] || 'secondary';
  const typeColor = TYPE_COLORS[ticket.issueType] || 'secondary';

  return (
    <Card className={cn(
      "transition-all duration-200",
      ticket.selected 
        ? "ring-2 ring-primary ring-offset-2 bg-primary/5" 
        : "hover:shadow-md"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-3 h-3 rounded-full cursor-pointer transition-colors",
                ticket.selected ? "bg-primary" : "bg-muted border-2 border-muted-foreground"
              )}
              onClick={onToggle}
            />
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {ticket.title || 'Untitled Ticket'}
                <Badge variant={typeColor}>
                  {ticket.issueType || 'Task'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.id || 'PROJ-XXX'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm">
          {ticket.priority && (
            <div className="flex items-center gap-1">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <Badge variant={priorityColor}>
                {ticket.priority}
              </Badge>
            </div>
          )}
          
          {ticket.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.assignee}</span>
            </div>
          )}
          
          {ticket.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{ticket.dueDate}</span>
            </div>
          )}
          
          {ticket.labels?.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {ticket.labels.slice(0, 3).map((label, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {ticket.labels.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{ticket.labels.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                {ticket.description.length > 200 
                  ? `${ticket.description.substring(0, 200)}...` 
                  : ticket.description
                }
              </div>
            </div>
          </>
        )}

        {/* Steps to Reproduce */}
        {ticket.stepsToReproduce && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Steps to Reproduce</h4>
              <div className="text-sm text-muted-foreground">
                <ol className="list-decimal list-inside space-y-1">
                  {ticket.stepsToReproduce.split('\n').filter(step => step.trim()).map((step, idx) => (
                    <li key={idx}>{step.replace(/^\d+\.?\s*/, '')}</li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        )}

        {/* Expected vs Actual */}
        {(ticket.expectedResult || ticket.actualResult) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ticket.expectedResult && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-success-600">Expected</h4>
                  <div className="text-sm text-muted-foreground bg-success-50 p-2 rounded border-l-2 border-success-500">
                    {ticket.expectedResult}
                  </div>
                </div>
              )}
              {ticket.actualResult && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-destructive">Actual</h4>
                  <div className="text-sm text-muted-foreground bg-destructive-50 p-2 rounded border-l-2 border-destructive">
                    {ticket.actualResult}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Environment */}
        {ticket.environment && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Environment</h4>
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {ticket.environment}
              </div>
            </div>
          </>
        )}

        {/* Attachments */}
        {ticket.attachments?.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                Attachments ({ticket.attachments.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((attachment, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {attachment.name || `Attachment ${idx + 1}`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Acceptance Criteria */}
        {ticket.acceptanceCriteria && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Acceptance Criteria</h4>
              <div className="space-y-1">
                {ticket.acceptanceCriteria.split('\n').filter(criteria => criteria.trim()).map((criteria, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{criteria.replace(/^[-•]\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
