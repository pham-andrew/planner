import './App.css';
import { useState, useEffect, useRef } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Collapse from '@mui/material/Collapse';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import EventIcon from '@mui/icons-material/Event';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import CoffeeMakerIcon from '@mui/icons-material/CoffeeMaker';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const API_BASE = 'http://localhost:5000'

const pastelTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e87568',
      light: '#f5a39a',
      dark: '#c9584d',
      contrastText: '#fffaf7',
    },
    secondary: {
      main: '#8eb8ad',
      light: '#c6ded5',
      dark: '#5e9185',
    },
    background: {
      default: '#fff8f3',
      paper: '#fffdfb',
    },
    text: {
      primary: '#493f3d',
      secondary: '#756965',
    },
    divider: '#eadbd4',
    error: {
      main: '#c65d58',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

const getBrowserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

const getTimeZoneList = () => {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone')
  }
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Hong_Kong',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
}

const browserTimeZone = getBrowserTimeZone()

function formatActivityDuration(start, end) {
  if (!start || !end) {
    return ''
  }

  const durationMinutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0) {
    return ''
  }

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  return `${hours} hours and ${String(minutes).padStart(2, '0')} minutes`
}

async function fetchPlan(secretId) {
  const response = await fetch(`${API_BASE}/obj/secret/${secretId}`)
  if (!response.ok) {
    throw new Error('Plan not found')
  }
  return response.json()
}

async function createPlan(name, timezone = browserTimeZone) {
  const response = await fetch(`${API_BASE}/obj/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, timezone }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create failed')
  }
  return response.json()
}

async function updatePlan(secretId, updates) {
  const response = await fetch(`${API_BASE}/obj/${secretId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) {
    throw new Error('Update failed')
  }
  return response.json()
}

async function createActivity(secretId, activity) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create activity failed')
  }
  return response.json()
}

async function createEvent(secretId, eventData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Create event failed')
  }
  return response.json()
}

async function updateActivity(secretId, activityId, activityData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities/${activityId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Update activity failed')
  }
  return response.json()
}

async function deleteActivity(secretId, activityId) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/activities/${activityId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Delete activity failed')
  }
  return response.json()
}

async function deleteEvent(secretId, eventId) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events/${eventId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Delete event failed')
  }
  return response.json()
}

async function updateEvent(secretId, eventId, eventData) {
  const response = await fetch(`${API_BASE}/obj/${secretId}/events/${eventId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Update event failed')
  }
  return response.json()
}

export default function App() {
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [plan, setPlan] = useState(null);
  const [editName, setEditName] = useState('');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [timeZones, setTimeZones] = useState([]);
  const [activityLookupLoading, setActivityLookupLoading] = useState(false);
  const [activityAdvancedOpen, setActivityAdvancedOpen] = useState(false);
  const viewerTabInitialized = useRef(false);
  const [editingActivityId, setEditingActivityId] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activityForm, setActivityForm] = useState({ name: '', description: '', address: '', locationLat: '', locationLng: '', suggestedStart: '', suggestedEnd: '' });
  const [eventForm, setEventForm] = useState({ activityId: '', start: '', end: '' });
  const [showEditLinkPopover, setShowEditLinkPopover] = useState(false);
  const editLinkButtonRef = useRef(null);

  const secretPath = window.location.pathname.startsWith('/plan/')
    ? window.location.pathname.replace('/plan/', '')
    : null
  const viewPath = window.location.pathname.startsWith('/view/')
    ? window.location.pathname.replace('/view/', '')
    : null

  async function fetchViewPlan(viewId) {
    const response = await fetch(`${API_BASE}/obj/view/${viewId}`)
    if (!response.ok) {
      throw new Error('Plan not found')
    }
    return response.json()
  }

  useEffect(() => {
    const id = viewPath || secretPath
    if (!id) return

    setLoading(true)
    const fetcher = viewPath ? fetchViewPlan : fetchPlan
    fetcher(id)
      .then((planData) => {
        setPlan({ ...planData, timezone: planData.timezone || browserTimeZone })
        setEditName(planData.name)
        setError('')
        if (secretPath) {
          setShowEditLinkPopover(true)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [secretPath, viewPath])

  const getPlanStartTimestamp = (value) => {
    if (!value) return Number.POSITIVE_INFINITY
    const date = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
  }

  useEffect(() => {
    if (!viewPath || !plan || viewerTabInitialized.current) {
      return
    }

    const eventStarts = (plan.events || [])
      .map((event) => event.start)
      .filter(Boolean)
      .map(getPlanStartTimestamp)

    const defaultTab = eventStarts.length === 0 || Date.now() < Math.min(...eventStarts)
      ? 1
      : 2

    setActiveTab(defaultTab)
    viewerTabInitialized.current = true
  }, [viewPath, plan])

  useEffect(() => {
    setTimeZones(getTimeZoneList())
  }, [])

  const handleCreate = async () => {
    if (!planName.trim()) {
      setError('Enter a plan name.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await createPlan(planName.trim(), browserTimeZone)
      window.location.href = `${window.location.origin}${result.editUrl}`
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetActivityForm = () => {
    setActivityForm({ name: '', description: '', address: '', locationLat: '', locationLng: '', suggestedStart: '', suggestedEnd: '' })
    setActivityError('')
    setEditingActivityId('')
  }

  const resetEventForm = () => {
    setEventForm({ activityId: '', start: '', end: '' })
    setEditingEventId('')
  }

  const openActivityDialog = (activity) => {
    setActivityAdvancedOpen(false)
    if (!activity) {
      resetActivityForm()
      setActivityDialogOpen(true)
      return
    }
    setEditingActivityId(String(activity._id || ''))
    setActivityForm({
      name: activity.name || '',
      description: activity.description || '',
      address: activity.address || '',
      locationLat: activity.location?.lat ?? '',
      locationLng: activity.location?.lng ?? '',
      suggestedStart: activity.suggestedStart || '',
      suggestedEnd: activity.suggestedEnd || '',
    })
    setActivityDialogOpen(true)
  }

  const openEventDialog = (event) => {
    if (!event) {
      resetEventForm()
      setSelectedEvent(null)
      setEventDialogOpen(true)
      return
    }
    setEditingEventId(String(event._id || ''))
    setSelectedEvent(event)
    setEventForm({
      activityId: String(event.activity?._id || ''),
      start: event.start || '',
      end: event.end || '',
    })
    setEventDialogOpen(true)
  }

  const closeActivityDialog = () => {
    setActivityDialogOpen(false)
    setActivityAdvancedOpen(false)
    resetActivityForm()
  }

  const closeEventDialog = () => {
    setEventDialogOpen(false)
    resetEventForm()
    setSelectedEvent(null)
  }

  const handleSaveActivity = async () => {
    if (!activityForm.name.trim()) {
      setActivityError('Activity name is required.')
      return
    }

    setActivityError('')
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: activityForm.name,
        description: activityForm.description,
        address: activityForm.address,
        duration: formatActivityDuration(activityForm.suggestedStart, activityForm.suggestedEnd),
        suggestedStart: activityForm.suggestedStart || undefined,
        suggestedEnd: activityForm.suggestedEnd || undefined,
        locationLat: activityForm.locationLat,
        locationLng: activityForm.locationLng,
      }
      if (activityForm.locationLat && activityForm.locationLng) {
        payload.location = { lat: Number(activityForm.locationLat), lng: Number(activityForm.locationLng) }
      }

      if (editingActivityId) {
        const result = await updateActivity(secretPath, editingActivityId, payload)
        setPlan((current) => {
          if (!current) return current
          const updatedActivities = (current.activities || []).map((activity) =>
            String(activity._id) === editingActivityId ? result.activity : activity
          )
          const updatedEvents = (current.events || []).map((event) =>
            String(event.activity?._id) === editingActivityId
              ? { ...event, activity: result.activity }
              : event
          )
          return { ...current, activities: updatedActivities, events: updatedEvents }
        })
      } else {
        const result = await createActivity(secretPath, payload)
        setPlan((current) => current ? { ...current, activities: [...(current.activities || []), result.activity] } : current)
      }

      closeActivityDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteActivity = async () => {
    if (!editingActivityId) return
    if (!window.confirm('Delete this activity? This cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteActivity(secretPath, editingActivityId)
      setPlan((current) => {
        if (!current) return current
        const remainingActivities = (current.activities || []).filter(
          (activity) => String(activity._id) !== editingActivityId
        )
        const remainingEvents = (current.events || []).filter(
          (event) => String(event.activity?._id) !== editingActivityId
        )
        return { ...current, activities: remainingActivities, events: remainingEvents }
      })
      closeActivityDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!editingEventId) return
    if (!window.confirm('Delete this event? This cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteEvent(secretPath, editingEventId)
      setPlan((current) => {
        if (!current) return current
        const remainingEvents = (current.events || []).filter(
          (event) => String(event._id) !== editingEventId
        )
        return { ...current, events: remainingEvents }
      })
      closeEventDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddressSuggest = async () => {
    if (!activityForm.address.trim()) {
      return
    }

    setActivityLookupLoading(true)
    setError('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(activityForm.address)}`)
      if (!response.ok) {
        throw new Error('Address lookup failed.')
      }
      const results = await response.json()
      if (!results.length) {
        setError('No location found for that address.')
        return
      }
      const { lat, lon } = results[0]
      setActivityForm((prev) => ({ ...prev, locationLat: lat, locationLng: lon }))
    } catch (err) {
      setError(err.message)
    } finally {
      setActivityLookupLoading(false)
    }
  }

  const handleSaveEvent = async () => {
    if (!eventForm.activityId) {
      setError('Select an activity for the event.')
      return
    }

    const selectedActivity = plan?.activities?.find((activity) => String(activity._id) === String(eventForm.activityId))
    if (!selectedActivity) {
      setError('Selected activity not found.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload = {
        activity: selectedActivity,
        start: eventForm.start || undefined,
        end: eventForm.end || undefined,
      }

      if (editingEventId) {
        const result = await updateEvent(secretPath, editingEventId, payload)
        setPlan((current) => {
          if (!current) return current
          const updatedEvents = (current.events || []).map((event) =>
            String(event._id) === editingEventId ? result.event : event
          )
          return { ...current, events: updatedEvents }
        })
      } else {
        const result = await createEvent(secretPath, payload)
        setPlan((current) => current ? { ...current, events: [...(current.events || []), result.event] } : current)
      }

      closeEventDialog()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNameBlur = async () => {
    if (!plan) {
      return
    }

    const trimmedName = editName.trim()
    if (!trimmedName) {
      setError('Plan name cannot be empty.')
      setEditName(plan.name)
      return
    }

    if (trimmedName === plan.name) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await updatePlan(secretPath, { name: trimmedName })
      setPlan((current) => current ? { ...current, name: trimmedName } : current)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTimezoneChange = async (event) => {
    const newTimezone = event.target.value
    if (!plan) return
    const previousTimezone = plan.timezone
    setPlan((current) => current ? { ...current, timezone: newTimezone } : current)
    setLoading(true)
    setError('')
    try {
      await updatePlan(secretPath, { timezone: newTimezone })
    } catch (err) {
      setError(err.message)
      setPlan((current) => current ? { ...current, timezone: previousTimezone } : current)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  }

  const formatPlanDateTime = (value) => {
    if (!value) {
      return null
    }
    const date = typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return String(value)
    }
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    }
    return plan?.timezone
      ? date.toLocaleString(undefined, { ...options, timeZone: plan.timezone })
      : date.toLocaleString(undefined, options)
  }

  const getPlanTimestampKey = (value) => {
    if (!value) {
      return Number.POSITIVE_INFINITY
    }
    if (typeof value === 'string') {
      if (value.includes('Z') || value.includes('+')) {
        const time = new Date(value).getTime()
        return Number.isFinite(time) ? time : value
      }
      return value
    }
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
  }

  const getPlanDateIso = (value) => {
    if (!value) {
      return ''
    }
    if (typeof value === 'string') {
      return value.split('T')[0]
    }
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: plan?.timezone || browserTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  }

  const getTodayIso = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: plan?.timezone || browserTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }

  const renderActivities = () => {
    if (!plan?.activities?.length) {
      return <Typography color='text.secondary'>No activities yet.</Typography>
    }
    return (
      <List dense>
        {plan.activities.map((activity, index) => {
          const lat = activity?.location?.lat
          const lng = activity?.location?.lng
          return (
            <ListItem
              key={`activity-${index}`}
              button={!!secretPath || !!viewPath}
              onClick={secretPath || viewPath ? () => openActivityDialog(activity) : undefined}
              sx={{ alignItems: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <ListItemText
                    primary={activity.name}
                    secondary={activity.description ? `${activity.description}` : ''}
                  />
                </Box>
                <Box sx={{ width: 185, height: 140 }}>
                  {lat !== undefined && lng !== undefined ? (
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.disabledBackground', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    )
  }

  const renderEvents = () => {
    if (!plan?.events?.length) {
      return <Typography color='text.secondary'>No events yet.</Typography>
    }
    const sortedEvents = [...plan.events].sort((a, b) => {
      return getPlanTimestampKey(a.start) - getPlanTimestampKey(b.start)
    })

    const groups = [];
    sortedEvents.forEach((event) => {
      const dayIso = getPlanDateIso(event.start) || 'no-date';
      let lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.dayIso !== dayIso) {
        groups.push({ dayIso, events: [event] });
      } else {
        lastGroup.events.push(event);
      }
    });

    return (
      <>
        {groups.map((group) => (
          <Box key={group.dayIso} sx={{ mb: 4 }}>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'primary.main', px: 1.5 }}>
                {group.dayIso === 'no-date' ? 'Unscheduled' : 
                  new Intl.DateTimeFormat('en-US', { 
                    weekday: 'long', month: 'short', day: 'numeric',
                    timeZone: plan?.timezone || browserTimeZone 
                  }).format(new Date(group.dayIso + 'T12:00:00'))}
              </Typography>
            </Divider>
            <List dense>
              {group.events.map((event, index) => {
                const lat = event?.activity?.location?.lat
                const lng = event?.activity?.location?.lng
                return (
                  <ListItem
                    key={`event-${index}`}
                    button={!!secretPath || !!viewPath}
                    onClick={secretPath || viewPath ? () => openEventDialog(event) : undefined}
                    sx={{ alignItems: 'flex-start' }}
                  >
                    <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                          {event.start ? formatPlanDateTime(event.start) : 'No start time'}
                        </Typography>
                        <ListItemText
                          primary={event.activity.name}
                          secondary={event.activity.description}
                        />
                      </Box>
                      <Box sx={{ width: 185, height: 140 }}>
                        {lat !== undefined && lng !== undefined ? (
                          <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                            <Marker position={[lat, lng]} />
                          </MapContainer>
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.disabledBackground', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        ))}
      </>
    )
  }

  const renderToday = () => {
    if (!plan?.events?.length) {
      return <Typography color='text.secondary'>There are no plans for today.</Typography>
    }
    const todayIso = getTodayIso()
    const todayEvents = [...plan.events]
      .filter((event) => event.start)
      .filter((event) => getPlanDateIso(event.start) === todayIso)
      .sort((a, b) => {
        return getPlanTimestampKey(a.start) - getPlanTimestampKey(b.start)
      })

    if (!todayEvents.length) {
      return <Typography color='text.secondary'>There are no plans for today.</Typography>
    }

    return (
      <List dense>
        {todayEvents.map((event, index) => {
          const lat = event?.activity?.location?.lat
          const lng = event?.activity?.location?.lng
          return (
            <ListItem
              key={`today-${index}`}
              button={!!secretPath || !!viewPath}
              onClick={secretPath || viewPath ? () => openEventDialog(event) : undefined}
              sx={{ alignItems: 'flex-start' }}
            >
              <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
                    {event.start ? formatPlanDateTime(event.start) : 'No start time'}
                  </Typography>
                  <ListItemText
                    primary={event.activity.name}
                    secondary={event.activity.description}
                  />
                </Box>
                <Box sx={{ width: 185, height: 140 }}>
                  {lat !== undefined && lng !== undefined ? (
                    <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                      <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                      <Marker position={[lat, lng]} />
                    </MapContainer>
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', bgcolor: 'action.disabledBackground', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant='caption' color='text.secondary'>No coordinates</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          )
        })}
      </List>
    )
  }

  const TabPanel = ({ children, value, index }) => {
    return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null
  }

  const CustomStepIcon = (props) => {
    const { active, completed, icon: stepKey } = props;

    const iconMap = {
      'x': completed ? <LocalActivityIcon /> : <LocalActivityOutlinedIcon />,
      'y': completed ? <EventIcon /> : <EventOutlinedIcon />,
      'z': completed ? <PlayArrowIcon /> : <PlayArrowOutlinedIcon />,
    };

    return (
      <Box sx={{ color: active || completed ? 'primary.main' : 'text.disabled', display: 'flex' }}>
        {iconMap[stepKey]}
      </Box>
    );
  };

  const renderContent = () => {
    if (!viewPath && !secretPath) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            position: 'relative',
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'center',
            bgcolor: { xs: 'background.default', md: 'transparent' },
            p: { xs: 0, md: 3 },
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              color: 'primary.main',
              bgcolor: 'rgba(232, 117, 104, 0.12)',
              backdropFilter: 'blur(8px)',
              px: 3,
              py: 1,
              borderRadius: 10,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid rgba(232, 117, 104, 0.35)',
              boxShadow: '0 4px 20px rgba(117, 78, 68, 0.12)',
              pointerEvents: 'none',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            📱 Site designed for mobile
          </Box>
          <Box sx={{ width: 'min(100%, 520px)', p: { xs: 2, md: 4 }, bgcolor: { xs: 'background.default', md: 'background.paper' }, borderRadius: { xs: 0, md: 4 }, boxShadow: { xs: 'none', md: '0 24px 80px rgba(117, 78, 68, 0.14)' } }}>
            <Typography variant='h4' mb={2} textAlign='center' sx={{ fontWeight: 700, color: 'text.primary' }}>
              Make a Plan
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label='Name your plan'
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <Tooltip title="Create Plan">
                <IconButton
                  color="primary"
                  onClick={handleCreate}
                  disabled={loading}
                  sx={{ mt: 0.5 }}
                >
                  <CoffeeMakerIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            </Box>
            {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
          </Box>
        </Box>
      )
    }

    const isEditor = !!secretPath;
    const eventLocations = (plan?.events || [])
      .filter(e => e.activity?.location?.lat != null && e.activity?.location?.lng != null)
      .map(e => ({
        lat: e.activity.location.lat,
        lng: e.activity.location.lng,
        name: e.activity.name
      }))

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'center',
          p: { xs: 0, md: 3 },
          pb: { xs: 10, md: 11 },
          bgcolor: { xs: 'background.default', md: 'transparent' },
        }}
      >
        <Box sx={{ width: 'min(100%, 760px)', p: { xs: 2, md: 4 }, bgcolor: { xs: 'background.default', md: 'background.paper' }, borderRadius: { xs: 0, md: 4 }, boxShadow: { xs: 'none', md: '0 24px 80px rgba(117, 78, 68, 0.14)' } }}>
          {(loading && !plan) && <Typography>Loading...</Typography>}
          {error && <Alert severity='error' sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {plan && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant='h4' component='h1' sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {isEditor && (
                    <>
                      <Tooltip title="Copy Edit Link">
                        <IconButton ref={editLinkButtonRef} size="small" onClick={() => copyToClipboard(window.location.href)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Popover
                        open={showEditLinkPopover}
                        anchorEl={editLinkButtonRef.current}
                        onClose={() => setShowEditLinkPopover(false)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      >
                        <Typography sx={{ p: 2, maxWidth: 250, fontSize: '0.875rem' }}>
                          Make sure to copy your edit link, if you lose it you will not be able to edit your plan.
                        </Typography>
                      </Popover>
                    </>
                  )}
                  <Tooltip title="Copy Share Link">
                    <IconButton size="small" onClick={() => copyToClipboard(isEditor ? `${window.location.origin}/view/${plan.viewSecret}` : window.location.href)}>
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isEditor && (
                    <Tooltip title="Settings">
                      <IconButton size="small" onClick={() => setSettingsDialogOpen(true)}>
                        <SettingsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              {eventLocations.length > 0 && (
                <Box sx={{ height: 175, width: '100%', mb: 3, borderRadius: 2, overflow: 'hidden', border: { xs: 0, md: 1 }, borderColor: 'divider' }}>
                  <MapContainer key={`summary-map-${eventLocations.length}`} bounds={eventLocations.map(loc => [loc.lat, loc.lng])} boundsOptions={{ padding: [50, 50] }} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                    {eventLocations.map((loc, idx) => (
                      <Marker key={idx} position={[loc.lat, loc.lng]}>
                        <Popup>{loc.name}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </Box>
              )}

              <Stepper activeStep={activeTab} alternativeLabel sx={{ mb: 4 }}>
                {['Activities', 'Itinerary', 'Go'].map((label, idx) => (
                  <Step key={label} onClick={() => setActiveTab(idx)} sx={{ cursor: 'pointer' }}>
                    <Tooltip title={[
                      "Add activities you potentially want to do.",
                      "String activities together with times.",
                      "See what's happening now."
                    ][idx]}>
                      <StepLabel StepIconComponent={CustomStepIcon} icon={['x', 'y', 'z'][idx]}>{label}</StepLabel>
                    </Tooltip>
                  </Step>
                ))}
              </Stepper>

              <TabPanel value={activeTab} index={0}>
                {renderActivities()}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {renderEvents()}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderToday()}
              </TabPanel>

              <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} fullWidth>
                <DialogTitle>Plan Settings</DialogTitle>
                <DialogContent>
                  <Stack spacing={3} sx={{ mt: 1 }}>
                    <TextField fullWidth label="Plan Name" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleNameBlur} />
                    <FormControl fullWidth>
                      <InputLabel id="plan-timezone-label">Plan Time Zone</InputLabel>
                      <Select labelId="plan-timezone-label" label="Plan Time Zone" value={plan.timezone || browserTimeZone} onChange={handleTimezoneChange} MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}>
                        {timeZones.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setSettingsDialogOpen(false)}>Close</Button></DialogActions>
              </Dialog>

              <Dialog open={activityDialogOpen} onClose={closeActivityDialog} fullWidth>
                <DialogTitle>{editingActivityId ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                <DialogContent>
                  {activityError && <Alert severity='error' sx={{ mb: 2 }}>{activityError}</Alert>}
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      label='Name'
                      value={activityForm.name}
                      required
                      onChange={(e) => {
                        setActivityForm((prev) => ({ ...prev, name: e.target.value }))
                        setActivityError('')
                      }}
                      disabled={!isEditor}
                    />
                    <TextField
                      label='Description'
                      value={activityForm.description}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, description: e.target.value }))}
                      disabled={!isEditor}
                    />
                    <TextField
                      label='Address or Place Name'
                      value={activityForm.address}
                      onChange={(e) => setActivityForm((prev) => ({ ...prev, address: e.target.value }))}
                      onBlur={handleAddressSuggest}
                      fullWidth
                      disabled={!isEditor}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <Box
                              onClick={() => setActivityAdvancedOpen((prev) => !prev)}
                              sx={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'text.secondary', whiteSpace: 'nowrap' }}
                            >
                              <Typography variant='body2'>Advanced</Typography>
                              <ExpandMoreIcon
                                fontSize='small'
                                sx={{ transform: activityAdvancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                              />
                            </Box>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Collapse in={activityAdvancedOpen}>
                      <Stack direction='row' spacing={1}>
                        <TextField
                          label='Latitude'
                          type='number'
                          value={activityForm.locationLat}
                          onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLat: e.target.value }))}
                          sx={{ flex: 1 }}
                          disabled={!isEditor || activityLookupLoading}
                        />
                        <TextField
                          label='Longitude'
                          type='number'
                          value={activityForm.locationLng}
                          onChange={(e) => setActivityForm((prev) => ({ ...prev, locationLng: e.target.value }))}
                          sx={{ flex: 1 }}
                          disabled={!isEditor || activityLookupLoading}
                        />
                      </Stack>
                    </Collapse>
                    <TextField label='Suggested Start' type='datetime-local' value={activityForm.suggestedStart} onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedStart: e.target.value }))} InputLabelProps={{ shrink: true }} disabled={!isEditor} />
                    <TextField label='Suggested End' type='datetime-local' value={activityForm.suggestedEnd} onChange={(e) => setActivityForm((prev) => ({ ...prev, suggestedEnd: e.target.value }))} InputLabelProps={{ shrink: true }} disabled={!isEditor} />
                  </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                  {!isEditor ? <Box /> : editingActivityId ? <Button color='error' onClick={handleDeleteActivity} disabled={loading}>Delete</Button> : <Box />}
                  <Box>
                    <Button onClick={closeActivityDialog}>Close</Button>
                    {isEditor && <Button onClick={handleSaveActivity} variant='contained' disabled={loading}>{editingActivityId ? 'Save Activity' : 'Add Activity'}</Button>}
                  </Box>
                </DialogActions>
              </Dialog>

              <Dialog open={eventDialogOpen} onClose={closeEventDialog} fullWidth>
                <DialogTitle>{!isEditor ? 'View Event' : editingEventId ? 'Edit Event' : 'Add Event'}</DialogTitle>
                <DialogContent>
                  {(!isEditor && selectedEvent) ? (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Typography variant='subtitle1'>Activity</Typography>
                      <Typography><strong>Name:</strong> {selectedEvent.activity?.name || '-'}</Typography>
                      <Typography><strong>Description:</strong> {selectedEvent.activity?.description || '-'}</Typography>
                      <Typography><strong>Address:</strong> {selectedEvent.activity?.address || '-'}</Typography>
                      <Typography><strong>Duration:</strong> {selectedEvent.activity?.duration || '-'}</Typography>
                      <Typography><strong>Suggested Start:</strong> {selectedEvent.activity?.suggestedStart ? formatPlanDateTime(selectedEvent.activity.suggestedStart) : '-'}</Typography>
                      <Typography><strong>Suggested End:</strong> {selectedEvent.activity?.suggestedEnd ? formatPlanDateTime(selectedEvent.activity.suggestedEnd) : '-'}</Typography>
                      {(selectedEvent.activity?.location?.lat !== undefined && selectedEvent.activity?.location?.lng !== undefined) && (
                        <Box sx={{ width: 185, height: 140 }}>
                          <MapContainer center={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                            <Marker position={[selectedEvent.activity.location.lat, selectedEvent.activity.location.lng]} />
                          </MapContainer>
                        </Box>
                      )}
                      <Divider />
                      <Typography variant='subtitle1'>Event</Typography>
                      <Typography><strong>Start:</strong> {selectedEvent.start ? formatPlanDateTime(selectedEvent.start) : '-'}</Typography>
                      <Typography><strong>End:</strong> {selectedEvent.end ? formatPlanDateTime(selectedEvent.end) : '-'}</Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel id='event-activity-label'>Select Activity</InputLabel>
                        <Select labelId='event-activity-label' label='Select Activity' value={eventForm.activityId} onChange={(e) => setEventForm((prev) => ({ ...prev, activityId: e.target.value }))} disabled={!isEditor}>
                          {plan?.activities?.map((activity) => <MenuItem key={String(activity._id)} value={String(activity._id)}>{activity.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField label='Event Start' type='datetime-local' value={eventForm.start} onChange={(e) => setEventForm((prev) => ({ ...prev, start: e.target.value }))} InputLabelProps={{ shrink: true }} disabled={!isEditor} />
                      <TextField label='Event End' type='datetime-local' value={eventForm.end} onChange={(e) => setEventForm((prev) => ({ ...prev, end: e.target.value }))} InputLabelProps={{ shrink: true }} disabled={!isEditor} />
                    </Stack>
                  )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                  {!isEditor ? <Box /> : editingEventId ? <Button color='error' onClick={handleDeleteEvent} disabled={loading}>Delete</Button> : <Box />}
                  <Box>
                    <Button onClick={closeEventDialog}>Close</Button>
                    {isEditor && <Button onClick={handleSaveEvent} variant='contained' disabled={loading}>{editingEventId ? 'Save Event' : 'Add Event'}</Button>}
                  </Box>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Box>
        {isEditor && (activeTab === 0 || activeTab === 1) && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100,
              px: { xs: 2, md: 3 },
              py: 1.5,
              bgcolor: 'rgba(255, 253, 251, 0.94)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 -8px 24px rgba(117, 78, 68, 0.1)',
            }}
          >
            {activeTab === 0 && (
              <Button variant='contained' color='primary' fullWidth onClick={() => openActivityDialog()} sx={{ width: 'min(100%, 760px)', display: 'flex', mx: 'auto' }}>
                Add Activity
              </Button>
            )}
            {activeTab === 1 && (
              <Button variant='contained' color='primary' fullWidth onClick={() => openEventDialog()} sx={{ width: 'min(100%, 760px)', display: 'flex', mx: 'auto' }}>
                Add Event
              </Button>
            )}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <ThemeProvider theme={pastelTheme}>
      <CssBaseline />
      {renderContent()}
    </ThemeProvider>
  )
}
