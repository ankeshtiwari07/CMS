# Atoms

Single-element building blocks.

## Buttons

### Button
Action button with two axes: appearance (solid, outline, ghost, link, soft, gradient, ai) and variant (primary, secondary, info, success, warning, destructive). shape controls border-radius (rounded=md, round=full-pill).

Props: appearance (solid|gradient|soft|outline|ghost|link|ai), variant (primary|secondary|info|success|warning|destructive), shape (rounded|round), size (default|xs|sm|md|lg|xl|2xl|icon|icon-xs|icon-sm|icon-lg|icon-xl|icon-2xl), render, loading, startIcon, endIcon, iconOnly, animated

Defaults: appearance="solid", variant="primary", shape="rounded", size="default"
Default shape="rounded" produces standard rectangular buttons (rounded-md). Use shape="round" for pill-shaped buttons (rounded-full).

```tsx
<Button appearance="solid" variant="primary" shape="rounded" size="md">Submit</Button>
<Button appearance="outline" variant="secondary" shape="rounded" render={<a href="/home" />}>Go Home</Button>
<Button appearance="ghost" variant="primary" size="icon"><Search className="size-4" /></Button>
```

### ButtonGroup
Grouped buttons with separators

### Toggle
Toggle button

## Display

### Badge
Status badge (gray, brand, error, warning, success)

Props: color (primary|secondary|info|success|warning|destructive), variant (solid|soft|outline|white|dot), size (xs|sm|md|lg), shape (round|rounded)

```tsx
<Badge variant="dot" color="success" size="sm">Active</Badge>
<Badge variant="white" color="primary" size="sm">Overlay</Badge>
```

### LoadingIndicator
Loading spinners

### Progress
Linear or circular progress indicator

Props: value (0-100), size (sm|md|lg|xl), color, circular, showValue

```tsx
<Progress value={75} />
<Progress circular value={60} size="md" showValue />
```

### Rating
Rating

### Skeleton
Loading placeholder

### SparklineChart
SparklineChart

## Forms

### Checkbox
Checkbox with variants and sizes. Accepts field props (label, error) for auto inline Field wrapping

Props: variant (primary|secondary|info|success|warning|destructive), size (sm|md|lg), checked, onCheckedChange, indeterminate
Field props: label, error, description, tooltip, fieldClassName

```tsx
<Checkbox checked={agreed} onCheckedChange={setAgreed} />
<Checkbox label="Accept terms" error={errors.agreed} />
```

### CheckboxGroup
Checkbox group with card layout, featured icons

### FileInput
FileInput

### Input
Text input with size variants, icons, addons. Accepts field props (label, error, description) for auto Field wrapping

Props: size (sm|md|lg), state (default|success|destructive), startIcon, endIcon, startAddon, endAddon
Field props: label, error, description, tooltip, required, fieldClassName

```tsx
<Input size="md" placeholder="Enter email" />
<Input label="Email" error={errors.email} placeholder="name@co.com" required />
<Input state="destructive" placeholder="Invalid input" />
```

### NumberInput
NumberInput

### RadioGroup
Radio group

### Select
Dropdown select with flat API. Accepts field props for auto Field wrapping. Use SelectRoot for compound API

Flat API: placeholder, size (xs|sm|md|lg), shape (rounded|round), readOnly
Field props: label, error, description, tooltip, topRight, bottomRight, fieldClassName
Use the flat `Select` API for normal fields and filters. Its popup anchors below/above the trigger by default; do not opt into selected-item overlap.

```tsx
<Select placeholder="Select..." value={value} onValueChange={setValue}>
  <SelectItem value="opt1">Option 1</SelectItem>
</Select>

<Select label="Role" error={errors.role} placeholder="Select a role">
  <SelectItem value="dev">Developer</SelectItem>
</Select>
```

For compound/custom triggers, use SelectRoot:
```tsx
<SelectRoot value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
  <SelectPopup alignItemWithTrigger={false} side="bottom" sideOffset={4}><SelectItem value="opt1">Option 1</SelectItem></SelectPopup>
</SelectRoot>
```

### SelectItem
SelectItem

### Slider
Range slider (single/dual handles)

Props: mode (single|range), value, onValueChange, min, max, label, labelMode (none|bottom|floating)

```tsx
<Slider mode="single" value={[50]} onValueChange={setVal} min={0} max={100} />
```

### Switch
Toggle switch. Accepts field props (label, description) for auto inline Field wrapping. Use theme-gradient, theme-switch, theme-pill, or theme-segmented variants for light/dark controls.

Props: variant (primary|secondary|warning|info|success|destructive|theme-gradient|theme-switch|theme-pill|theme-segmented), size (sm|md|lg), checked, onCheckedChange
Field props: label, description, tooltip, fieldClassName

```tsx
<Switch checked={on} onCheckedChange={setOn} />
<Switch label="Enable notifications" description="Get email alerts" />
<Switch variant="theme-segmented" />
```

### Textarea
Multi-line input. Accepts field props (label, error, description) for auto Field wrapping

Props: state (default|success|destructive), startIcon, endIcon, hasOutline
Field props: label, error, description, tooltip, required, fieldClassName

```tsx
<Textarea placeholder="Type here..." />
<Textarea label="Message" description="Max 500 chars" />
<Textarea state="destructive" placeholder="Explain the issue" />
```

## Layout

### AccordionCard
Card with expandable content

### AspectRatio
Maintain aspect ratio

### Card
Container with header, content, footer

Compound API: Card, Card.Header, Card.Title, Card.Description, Card.Action, Card.Content, Card.Footer
Props: size (default|sm), padding (none|md)
Props (Card.Content): padding (none|md)
Defaults: padding="md" on Card and Card.Content. Use padding="none" for edge-to-edge media, charts, or custom table chrome.

```tsx
<Card>
  <Card.Header><Card.Title>Title</Card.Title></Card.Header>
  <Card.Content>Body</Card.Content>
  <Card.Footer>Footer</Card.Footer>
</Card>
```

### Resizable
Resizable panel layout

### ScrollArea
Custom scrollbars

### Separator
Visual separator supporting single-line, dual-line, and background-fill Figma treatments with optional text, heading, or custom center content

Props: appearance (single|dual|filled), orientation (horizontal|vertical), label, labelVariant (text|heading), children

Defaults: appearance="single", orientation="horizontal", labelVariant="text"

Use `label` for accessible text separators. Use `children` for centered content such as `Button` or `ButtonGroup`; the wrapper intentionally does not set `role="separator"` around interactive children.

```tsx
<Separator />
<Separator label="Today" />
<Separator appearance="dual" label="Notifications" labelVariant="heading" />
<Separator appearance="filled" label="Today" />

<Separator>
  <Button size="sm">Add</Button>
</Separator>
```

## Workflow

### WorkflowAddNode
WorkflowAddNode

### WorkflowCircleNode
WorkflowCircleNode

### WorkflowComment
WorkflowComment

### WorkflowConnection
WorkflowConnection

### WorkflowNode
WorkflowNode

### WorkflowPort
WorkflowPort
