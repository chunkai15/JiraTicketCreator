# 🗺️ COMPONENT MAPPING - ANT DESIGN → SHADCN/UI

## Component Migration Reference

### UI Components

| Ant Design | shadcn/ui | Notes | Complexity |
|------------|-----------|-------|------------|
| `Button` | `Button` | Direct replacement, similar API | ⭐ Easy |
| `Input` | `Input` | Direct replacement | ⭐ Easy |
| `TextArea` | `Textarea` | Direct replacement | ⭐ Easy |
| `Select` | `Select` | Different API, needs adapter | ⭐⭐ Medium |
| `Card` | `Card` | Similar structure | ⭐ Easy |
| `Table` | `Table` | Very different, needs custom logic | ⭐⭐⭐ Hard |
| `Modal` | `Dialog` | Different API | ⭐⭐ Medium |
| `Collapse` | `Accordion` | Similar concept | ⭐ Easy |
| `Menu` | Custom + `DropdownMenu` | Needs custom implementation | ⭐⭐ Medium |
| `Steps` | Custom | No direct replacement | ⭐⭐⭐ Hard |
| `Upload` | Custom | No direct replacement | ⭐⭐⭐ Hard |
| `Switch` | `Switch` | Direct replacement | ⭐ Easy |
| `Checkbox` | `Checkbox` | Direct replacement | ⭐ Easy |
| `Tooltip` | `Tooltip` | Direct replacement | ⭐ Easy |
| `Tag` | `Badge` | Similar concept | ⭐ Easy |
| `Progress` | `Progress` | Direct replacement | ⭐ Easy |
| `Divider` | `Separator` | Direct replacement | ⭐ Easy |
| `Space` | Tailwind Flex/Grid | Use Tailwind utilities | ⭐ Easy |
| `Row/Col` | Tailwind Grid | Use Tailwind grid | ⭐ Easy |
| `Alert` | `Alert` | Direct replacement | ⭐ Easy |
| `Spin` | Custom + `Skeleton` | Use loading states | ⭐⭐ Medium |

---

## Component-by-Component Migration Guide

### 1. Button Component

**Ant Design:**
```jsx
import { Button } from 'antd';

<Button type="primary" size="large" onClick={handleClick}>
  Click me
</Button>
```

**shadcn/ui:**
```jsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg" onClick={handleClick}>
  Click me
</Button>
```

**Prop Mapping:**
- `type="primary"` → `variant="default"`
- `type="default"` → `variant="outline"`
- `type="dashed"` → `variant="outline"` (add custom class)
- `type="text"` → `variant="ghost"`
- `type="link"` → `variant="link"`
- `danger` → `variant="destructive"`
- `size="large"` → `size="lg"`
- `size="middle"` → `size="default"`
- `size="small"` → `size="sm"`

---

### 2. Input Component

**Ant Design:**
```jsx
import { Input } from 'antd';

<Input
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**shadcn/ui:**
```jsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

**Notes:**
- Almost identical API
- May need to add custom styling for prefix/suffix icons

---

### 3. Select Component

**Ant Design:**
```jsx
import { Select } from 'antd';

<Select
  value={value}
  onChange={setValue}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ]}
/>
```

**shadcn/ui:**
```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Notes:**
- More verbose but more flexible
- Need to map option arrays to SelectItem components
- Consider creating a wrapper component for easier migration

**Recommended Wrapper:**
```jsx
// src/components/ui/select-wrapper.jsx
export function SelectWrapper({ value, onChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

### 4. Card Component

**Ant Design:**
```jsx
import { Card } from 'antd';

<Card title="Card Title">
  Card content
</Card>
```

**shadcn/ui:**
```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

**Notes:**
- More structured with separate components
- More flexible layout

---

### 5. Table Component

**Ant Design:**
```jsx
import { Table } from 'antd';

<Table
  dataSource={data}
  columns={columns}
  rowKey="id"
  rowSelection={rowSelection}
/>
```

**shadcn/ui:**
```jsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      {columns.map((col) => (
        <TableHead key={col.key}>{col.title}</TableHead>
      ))}
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id}>
        {columns.map((col) => (
          <TableCell key={col.key}>
            {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Notes:**
- Very different API
- Need custom logic for:
  - Row selection
  - Sorting
  - Filtering
  - Pagination
  - Inline editing
- Consider using @tanstack/react-table for complex tables

**Recommended Approach:**
```jsx
// Use @tanstack/react-table
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // ... other options
});
```

---

### 6. Modal/Dialog Component

**Ant Design:**
```jsx
import { Modal } from 'antd';

<Modal
  title="Modal Title"
  open={open}
  onOk={handleOk}
  onCancel={handleCancel}
>
  Modal content
</Modal>
```

**shadcn/ui:**
```jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <div>Modal content</div>
    <DialogFooter>
      <Button variant="outline" onClick={handleCancel}>
        Cancel
      </Button>
      <Button onClick={handleOk}>OK</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Prop Mapping:**
- `open` → `open`
- `onCancel` → `onOpenChange(false)`
- Need to manually add OK/Cancel buttons

---

### 7. Collapse/Accordion Component

**Ant Design:**
```jsx
import { Collapse } from 'antd';

<Collapse>
  <Collapse.Panel header="Panel 1" key="1">
    Content 1
  </Collapse.Panel>
  <Collapse.Panel header="Panel 2" key="2">
    Content 2
  </Collapse.Panel>
</Collapse>
```

**shadcn/ui:**
```jsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Panel 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Panel 2</AccordionTrigger>
    <AccordionContent>Content 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Notes:**
- Similar concept, different structure
- `type="single"` for one item open
- `type="multiple"` for multiple items open

---

### 8. Menu/Navigation Component

**Ant Design:**
```jsx
import { Menu } from 'antd';

<Menu
  mode="horizontal"
  selectedKeys={[currentKey]}
  items={menuItems}
  onClick={handleClick}
/>
```

**shadcn/ui:**
```jsx
// Option 1: Custom Navigation
import { cn } from '@/lib/utils';

<nav className="flex space-x-4">
  {menuItems.map((item) => (
    <a
      key={item.key}
      href={item.path}
      className={cn(
        "px-3 py-2 rounded-md text-sm font-medium",
        currentKey === item.key
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {item.label}
    </a>
  ))}
</nav>

// Option 2: Using DropdownMenu for complex menus
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

**Notes:**
- No direct equivalent
- Need custom implementation
- Use Tailwind for styling
- Consider using React Router NavLink

---

### 9. Steps Component

**Ant Design:**
```jsx
import { Steps } from 'antd';

<Steps current={currentStep}>
  <Steps.Step title="Step 1" description="Description" />
  <Steps.Step title="Step 2" description="Description" />
  <Steps.Step title="Step 3" description="Description" />
</Steps>
```

**shadcn/ui:**
```jsx
// No direct component, create custom
// src/components/ui/steps.jsx
export function Steps({ current, items }) {
  return (
    <ol className="flex items-center w-full">
      {items.map((item, index) => (
        <li key={index} className={cn(
          "flex items-center",
          index !== items.length - 1 && "w-full"
        )}>
          <div className="flex flex-col items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              index < current && "bg-primary text-primary-foreground",
              index === current && "bg-primary text-primary-foreground",
              index > current && "bg-muted text-muted-foreground"
            )}>
              {index < current ? (
                <Check className="w-5 h-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="mt-2 text-sm font-medium">{item.title}</div>
            {item.description && (
              <div className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </div>
            )}
          </div>
          {index !== items.length - 1 && (
            <div className={cn(
              "w-full h-1 mx-4",
              index < current ? "bg-primary" : "bg-muted"
            )} />
          )}
        </li>
      ))}
    </ol>
  );
}
```

---

### 10. Upload Component

**Ant Design:**
```jsx
import { Upload } from 'antd';

<Upload
  fileList={fileList}
  onChange={handleChange}
  beforeUpload={beforeUpload}
>
  <Button icon={<UploadOutlined />}>Upload</Button>
</Upload>
```

**shadcn/ui:**
```jsx
// No direct component, create custom with input[type="file"]
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FileUpload({ onChange, accept, multiple }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    onChange(files);
  };

  return (
    <div>
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <Button onClick={handleClick}>
        <Upload className="w-4 h-4 mr-2" />
        Upload Files
      </Button>
    </div>
  );
}
```

---

## Layout Migration

### Space Component

**Ant Design:**
```jsx
<Space direction="vertical" size="large">
  <Component1 />
  <Component2 />
</Space>
```

**Tailwind:**
```jsx
<div className="flex flex-col gap-6">
  <Component1 />
  <Component2 />
</div>
```

**Mapping:**
- `direction="horizontal"` → `flex-row`
- `direction="vertical"` → `flex-col`
- `size="small"` → `gap-2` (8px)
- `size="middle"` → `gap-4` (16px)
- `size="large"` → `gap-6` (24px)

---

### Row/Col Grid

**Ant Design:**
```jsx
<Row gutter={16}>
  <Col span={12}>Column 1</Col>
  <Col span={12}>Column 2</Col>
</Row>
```

**Tailwind:**
```jsx
<div className="grid grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

**Responsive:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive columns */}
</div>
```

---

## Icon Migration

### Ant Design Icons → Lucide React

**Ant Design:**
```jsx
import {
  SettingOutlined,
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons';
```

**Lucide React:**
```jsx
import {
  Settings,
  User,
  Home
} from 'lucide-react';
```

**Common Icon Mappings:**
- `SettingOutlined` → `Settings`
- `UserOutlined` → `User`
- `HomeOutlined` → `Home`
- `DeleteOutlined` → `Trash` or `Trash2`
- `EditOutlined` → `Edit` or `Pencil`
- `PlusOutlined` → `Plus`
- `CloseOutlined` → `X`
- `CheckOutlined` → `Check`
- `SearchOutlined` → `Search`
- `UploadOutlined` → `Upload`
- `DownloadOutlined` → `Download`

---

## Form Handling

### Ant Design Form

**Ant Design:**
```jsx
import { Form, Input } from 'antd';

<Form onFinish={handleSubmit}>
  <Form.Item name="email" rules={[{ required: true }]}>
    <Input placeholder="Email" />
  </Form.Item>
  <Form.Item>
    <Button type="primary" htmlType="submit">
      Submit
    </Button>
  </Form.Item>
</Form>
```

**shadcn/ui with react-hook-form:**
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  email: z.string().email(),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Message/Toast Notifications

### Ant Design Message

**Ant Design:**
```jsx
import { message } from 'antd';

message.success('Success!');
message.error('Error!');
message.warning('Warning!');
```

**shadcn/ui with Sonner:**
```jsx
import { toast } from 'sonner';

toast.success('Success!');
toast.error('Error!');
toast.warning('Warning!');
```

**Setup:**
```jsx
// In App.js or layout
import { Toaster } from 'sonner';

<Toaster position="top-right" richColors />
```

---

## Custom Components to Create

### Priority 1 (Essential)
1. ✅ Steps component
2. ✅ File upload component
3. ✅ Data table wrapper (with @tanstack/react-table)
4. ✅ Select wrapper (for easier migration)
5. ✅ Loading spinner/skeleton

### Priority 2 (Nice to have)
1. ⭐ Empty state component
2. ⭐ Result component (success/error states)
3. ⭐ Statistics card
4. ⭐ Timeline component
5. ⭐ Breadcrumb component

---

## Migration Strategy Per Component

### Simple Components (1-2 hours each)
- Button
- Input
- Card
- Switch
- Checkbox
- Tag/Badge
- Tooltip
- Alert
- Divider/Separator

### Medium Components (2-4 hours each)
- Select
- Modal/Dialog
- Collapse/Accordion
- Form
- Upload
- Menu/Navigation

### Complex Components (4-8 hours each)
- Table (with all features)
- Steps
- Preview Table with inline editing
- Release components

---

## Testing Checklist per Component

For each migrated component, verify:
- [ ] Props work as expected
- [ ] Events fire correctly
- [ ] Styling matches design
- [ ] Responsive on all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Dark mode works (if applicable)
- [ ] All edge cases handled

---

## Quick Reference

### Most Common Patterns

**Spacing:**
- `margin-bottom: 24px` → `mb-6`
- `padding: 16px` → `p-4`
- `gap: 12px` → `gap-3`

**Colors:**
- Primary: `text-primary`, `bg-primary`
- Secondary: `text-secondary`, `bg-secondary`
- Muted: `text-muted-foreground`, `bg-muted`
- Destructive: `text-destructive`, `bg-destructive`

**Typography:**
- Title: `text-2xl font-semibold`
- Subtitle: `text-lg font-medium`
- Body: `text-sm`
- Caption: `text-xs text-muted-foreground`

**Layout:**
- Container: `container mx-auto px-4`
- Card: `<Card><CardHeader><CardTitle>...</CardTitle></CardHeader><CardContent>...</CardContent></Card>`
- Flex: `flex items-center justify-between`
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

---

**Last Updated:** October 10, 2025
**Status:** Ready to Use

