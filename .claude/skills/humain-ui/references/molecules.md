# Molecules

Compose atoms into functional units.

## Charts

### BarChart
Vertical bars (grouped/stacked)

Props: data, series, barMode (stacked|grouped), size (sm|default|lg|xl), showYAxis, showXAxis, legendPosition (none|top|right)

Default palette — stacked: `[--slate-500, --chart-2, --chart-1]` (neutral baseline, then primary stack). Grouped: full categorical `[--chart-1..5]`. Override per series via `series.color` (any CSS color).

```tsx
<BarChart data={data} series={[
  { id: 'a', label: 'A' },                          // → --slate-500 (stacked) / --chart-1 (grouped)
  { id: 'b', label: 'B', color: 'var(--green-500)' }, // explicit override
]} barMode="grouped" showYAxis showXAxis />
```

### DonutChart
Donut chart

Props: data, series, centerValue, centerLabel, size (xs|sm|md|lg), legendPosition (none|bottom|right)

Default palette: `[--chart-1, --chart-2, --chart-3]`. Donut data points may set `color` to override.

```tsx
<DonutChart data={data} series={series} centerValue="85%" centerLabel="Score" />
```

### HorizontalBarChart
Horizontal bars

Props: data, barColor (default `var(--chart-1)`), valueFormatter, size (sm|default|lg)

Single-color bar list. Override globally via `barColor` or per-bar via `data[i].color`.

```tsx
<HorizontalBarChart data={data} barColor="var(--chart-2)" />
```

### LineChart
Time series with multiple series

Props: data, series, size (sm|default|lg|xl), showYAxis, showXAxis, legendPosition (none|top|right)

Default palette: `[--chart-1, --chart-2, --chart-3, --chart-4, --chart-5]` — categorical, mode-aware. Override via `series.color`.

```tsx
<LineChart data={data} series={[
  { id: 'rev', label: 'Revenue' },                              // → --chart-1
  { id: 'cost', label: 'Cost', color: 'var(--destructive)' },    // semantic override
]} showYAxis showXAxis />
```

Use CSS variables for overrides so theme retargeting remains token-backed. Do not import lower-level chart primitives from the package root unless they are explicitly exported.

### PieChart
Pie chart

Props: data, series, size (sm|default|lg|xl), legendPosition (none|bottom|right)

Default palette: `[--chart-1..5, --slate-500]` — last slot is the neutral baseline for "other" categories. Override per data point via `d.color`.

```tsx
<PieChart data={data} series={series} legendPosition="right" />
```

### RadarChart
Multi-dimensional comparison

Props: data, series, size (sm|default|lg|xl), legendPosition (none|top|right)

Default palette: same as LineChart (`[--chart-1..5]`). Override per series via `series.color`.

```tsx
<RadarChart data={data} series={series} />
```

## Data

### Avatar
User avatar with fallback, status

Props: src, alt, fallback, size (xs|sm|md|lg|xl|2xl), status

```tsx
<Avatar src="/avatar.png" alt="User" fallback="JD" size="md" />
```

### BrandIcon
BrandIcon

### Calendar
Full calendar (month/week/day) with events

Props: view (month|week|day), onViewChange, selectedDate, onDateSelect, events, onEventClick

```tsx
<Calendar view="month" events={events} onDateSelect={setDate} />
```

### CodeSnippet
Syntax-highlighted code with line numbers

### DatePicker
Date input with calendar popup, range support

Props: value, onChange, placeholder, dateFormat, minDate, maxDate, disabled

```tsx
<DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
```

### FeaturedIcon
Styled icon container with size (xs-lg), shape (rounded/round), and color variants

### Item
Item

### Kbd
Keyboard shortcut display (platform-aware)

### Table
Basic table

### Tag
Small tag/chip for labels, filters

### WeekCalendar
Weekly view with time slots

## Feedback

### Alert
Alert

### LoadingOverlay
Full-screen loading overlay

### Sonner
Toast notification system

## Files

### FileTypeIcon
File extension icon display

### FileUpload
Upload w/ drag-drop and Figma mini-card file queue. Uses `useDropZone` hook internally.

Components: FileUpload, FileUploadArea, FileUploadItem
Props: files, onFilesSelected, onFileRemove, onFileCancel, areaProps

FileUploadItem uses the Figma FileMiniCard as its only design. Use `mobile` for the 100x100 mobile mini-card; do not pass the removed `progressType` variants.

```tsx
<FileUpload files={files} onFilesSelected={setFiles} onFileRemove={handleRemove} />
```

```tsx
<FileUploadItem fileName="Report.pdf" fileSize="200 KB" fileExtension="pdf" progress={70} status="uploading" onCancel={handleCancel} />
<FileUploadItem mobile fileName="Report.pdf" fileExtension="pdf" progress={0} status="error" onRetry={handleRetry} />
```

### useDropZone (hook)
Reusable drag-drop behavior hook. Handles drag counter, accept filtering, multiple enforcement, file picker.

```tsx
import { useDropZone } from '@humain/ui';

const { isDragging, dropZoneProps, openFilePicker } = useDropZone({
  onFilesSelected: handleFiles,
  accept: 'image/*',
  multiple: true,
});

<div {...dropZoneProps}>Drop zone content</div>
```

## Forms

### Autocomplete
Autocomplete input with multi-select. Accepts field props for auto Field wrapping

### ComboboxMenu
Autocomplete with keyboard nav

### DisplayValue
Read-only label/value display

### Field
Form field wrapper with label, hint, error

### Form
Form container with validation

### InputGroup
Grouped input with addons

### InputOTP
One-time password input

### RichTextarea
Rich text editor with formatting toolbar

## Navigation

### Accordion
Collapsible sections

Components: Accordion, AccordionItem, AccordionTrigger, AccordionContent

```tsx
<Accordion>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content</AccordionContent>
  </AccordionItem>
</Accordion>
```

### Breadcrumb
Navigation breadcrumbs

Components: Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage
Props (Breadcrumb): separator (chevron|slash), ring
Props (BreadcrumbLink/BreadcrumbPage): variant (text|soft-badge|outline-badge)

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbItem><BreadcrumbPage>Current</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Carousel
Carousel

### Collapsible
Collapsible content section

### Pagination
Page navigation

Props: type (page-default|page-minimal|card-default|card-minimal|card-button-group), shape (square|circle), currentPage, totalPages, onPageChange, showPageNumbers

```tsx
<Pagination currentPage={1} totalPages={10} onPageChange={setPage} />
```

### Tabs
Tab navigation (underline, pills, button variants); horizontal or vertical orientation

Components: Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator
Props (Tabs): value, defaultValue, onValueChange, orientation (horizontal|vertical, default horizontal)
Props (TabsList): variant (boxed|pill|bordered|lifted), align (start|center|end|stretch)

`orientation="vertical"` flips the layout from column to row — list renders alongside content instead of stacked above it. The DOM exposes `data-orientation` on the root for any custom styling. Keyboard arrow nav follows orientation.

```tsx
// Horizontal (default)
<Tabs defaultValue="tab1">
  <TabsList variant="bordered">
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsIndicator />
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
</Tabs>

// Vertical — list on the side, content adjacent
<Tabs defaultValue="account" orientation="vertical">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="security">Security settings</TabsContent>
  <TabsContent value="billing">Billing settings</TabsContent>
</Tabs>
```
