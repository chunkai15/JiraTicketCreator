import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Rocket,
  ArrowRight,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const tools = [
  {
    id: 'ticket-creator',
    title: 'Jira Ticket Creator',
    description: 'Parse unstructured text into Jira tickets using intelligent regex patterns. Perfect for QA engineers and development teams.',
    icon: FileText,
    path: '/ticket-creator',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      'Smart text parsing',
      'Bulk ticket creation',
      'File attachments',
      'Translation support'
    ],
    stats: { created: 24, thisWeek: true },
    badge: 'Production Ready'
  },
  {
    id: 'release-creator',
    title: 'Release Page Creator',
    description: 'Generate Confluence release pages from Jira releases with automated checklist creation and Jira issue macros.',
    icon: Rocket,
    path: '/release-creator',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    features: [
      'Auto-fetch releases',
      'Generate pages',
      'Standardized checklists',
      'Customizable templates'
    ],
    stats: { created: 5, thisWeek: true },
    badge: 'New Feature'
  }
];

const stats = [
  { label: 'Tickets Created', value: '24', icon: FileText, change: '+12%', trend: 'up' },
  { label: 'Releases Published', value: '5', icon: Rocket, change: '+25%', trend: 'up' },
  { label: 'Time Saved', value: '4.2h', icon: Clock, change: '+18%', trend: 'up' },
  { label: 'Success Rate', value: '98%', icon: CheckCircle2, change: '+2%', trend: 'up' }
];

const recentActivity = [
  { type: 'ticket', title: 'Created MP-1234: Login Bug', time: '2 minutes ago' },
  { type: 'release', title: 'Published v1.2.0 Release Page', time: '1 hour ago' },
  { type: 'ticket', title: 'Updated 5 tickets', time: '3 hours ago' }
];

const features = [
  {
    icon: Shield,
    title: 'Secure Integration',
    description: 'All credentials encrypted and stored locally'
  },
  {
    icon: CheckCircle2,
    title: 'Production Ready',
    description: 'Battle-tested tools for daily workflows'
  },
  {
    icon: Sparkles,
    title: 'Extensible',
    description: 'Modular architecture for easy customization'
  }
];

export default function ToolHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Quick actions at your fingertips
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <TrendingUp className={`h-3 w-3 ${stat.trend === 'up' ? 'text-success-500' : 'text-error-500'}`} />
                    {stat.change} from last week
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tools Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                      <Icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                    <Badge variant="secondary">{tool.badge}</Badge>
                  </div>
                  <CardTitle className="mt-4">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Key Features:</p>
                      <ul className="grid grid-cols-2 gap-2">
                        {tool.features.map((feature, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-success-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {tool.stats.thisWeek && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4" />
                        <span>{tool.stats.created} created this week</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={() => navigate(tool.path)}
                    className="w-full group"
                  >
                    Open Tool
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Activity & Features */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${activity.type === 'ticket' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                      {activity.type === 'ticket' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Rocket className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4">
                View All Activity
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Why Choose Us?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <p className="font-medium text-sm">{feature.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

