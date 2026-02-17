import { useState, useEffect, useRef } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  TextField,
  Box,
  Container,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  ListItemButton,
  ListItemSecondaryAction,
  Stack,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  Menu as MenuIcon,
  Delete,
  Add,
  Save,
  Edit,
  Flip,
  Settings,
  Brightness4,
  Brightness7,
  Close,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  SwapVert,
  Folder,
  ArrowBack
} from '@mui/icons-material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

function App() {
  const [scripts, setScripts] = useState([])
  const [currentScript, setCurrentScript] = useState(null)
  const [text, setText] = useState('')
  const [scriptName, setScriptName] = useState('')
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(2)
  const [fontSize, setFontSize] = useState(32)
  const [isReversed, setIsReversed] = useState(false)
  const [isFlippedVertically, setIsFlippedVertically] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [textAlign, setTextAlign] = useState('left')
  const [showDrawer, setShowDrawer] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingScript, setEditingScript] = useState(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showPrompter, setShowPrompter] = useState(false)
  const [currentGroupId, setCurrentGroupId] = useState(null)
  const [selectedParentId, setSelectedParentId] = useState(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const scrollContainerRef = useRef(null)
  const animationRef = useRef(null)
  const scrollAccumulatorRef = useRef(0)

  // Load scripts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-scripts')
    if (saved) {
      const parsed = JSON.parse(saved)
      setScripts(parsed)
    }
  }, [])

  // Save scripts to localStorage
  useEffect(() => {
    if (scripts.length > 0) {
      localStorage.setItem('teleprompter-scripts', JSON.stringify(scripts))
    }
  }, [scripts])

  // Auto-save settings when they change for current script
  useEffect(() => {
    if (currentScript) {
      setScripts(scripts.map(s => 
        s.id === currentScript.id 
          ? { ...s, fontSize, scrollSpeed }
          : s
      ))
    }
  }, [fontSize, scrollSpeed])

  // Auto-scroll
  useEffect(() => {
    if (isScrolling && scrollContainerRef.current) {
      const scroll = () => {
        if (scrollContainerRef.current) {
          // Accumulate fractional pixels
          scrollAccumulatorRef.current += scrollSpeed
          
          // Only scroll when we have at least 1 pixel
          if (scrollAccumulatorRef.current >= 1) {
            const pixelsToScroll = Math.floor(scrollAccumulatorRef.current)
            scrollContainerRef.current.scrollTop += pixelsToScroll
            scrollAccumulatorRef.current -= pixelsToScroll
          }
          
          animationRef.current = requestAnimationFrame(scroll)
        }
      }
      animationRef.current = requestAnimationFrame(scroll)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      scrollAccumulatorRef.current = 0
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isScrolling, scrollSpeed])

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  })

  const saveScript = () => {
    if (!scriptName.trim()) return
    if (!isCreatingGroup && !editingScript?.isGroup && !text.trim()) return
    
    // Convert parentId to number or null
    const parentIdValue = selectedParentId ? Number(selectedParentId) : null
    
    if (editingScript) {
      // Update existing script
      setScripts(scripts.map(s => 
        s.id === editingScript.id 
          ? { 
              ...s, 
              name: scriptName, 
              content: editingScript.isGroup ? '' : text,
              fontSize, 
              scrollSpeed,
              parentId: parentIdValue,
              isGroup: editingScript.isGroup
            }
          : s
      ))
      setEditingScript(null)
    } else {
      // Create new script
      const newScript = {
        id: Date.now(),
        name: scriptName,
        content: isCreatingGroup ? '' : text,
        fontSize: fontSize,
        scrollSpeed: scrollSpeed,
        parentId: parentIdValue,
        isGroup: isCreatingGroup,
      }
      setScripts([...scripts, newScript])
    }
    
    setScriptName('')
    setText('')
    setSelectedParentId(null)
    setIsCreatingGroup(false)
    setShowEditDialog(false)
  }

  const loadScript = (script) => {
    if (script.isGroup) {
      // Navigate into the group
      setCurrentGroupId(script.id)
    } else {
      // Load the script
      setCurrentScript(script)
      setText(script.content)
      // Load saved settings for this script
      if (script.fontSize) setFontSize(script.fontSize)
      if (script.scrollSpeed) setScrollSpeed(script.scrollSpeed)
      setShowDrawer(false)
      setShowPrompter(true)
    }
  }

  const deleteScript = (id) => {
    const scriptToDelete = scripts.find(s => s.id === id)
    
    if (scriptToDelete?.isGroup) {
      // If deleting a group, also delete all children
      const childIds = scripts.filter(s => s.parentId === id).map(s => s.id)
      setScripts(scripts.filter(s => s.id !== id && !childIds.includes(s.id)))
      
      // Navigate back if we're currently viewing this group
      if (currentGroupId === id) {
        setCurrentGroupId(null)
      }
    } else {
      // Just delete the single script
      setScripts(scripts.filter(s => s.id !== id))
    }
    
    if (currentScript?.id === id) {
      setCurrentScript(null)
      setText('')
    }
  }

  const updateScript = () => {
    if (!currentScript || !text.trim()) return
    
    setScripts(scripts.map(s => 
      s.id === currentScript.id 
        ? { ...s, content: text, fontSize, scrollSpeed }
        : s
    ))
  }

  const jumpToStart = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  const jumpToEnd = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }

  const newScript = () => {
    setCurrentScript(null)
    setEditingScript(null)
    setText('')
    setScriptName('')
    setShowEditDialog(true)
  }

  const editScript = (script) => {
    setEditingScript(script)
    setScriptName(script.name)
    setText(script.content || '')
    setIsCreatingGroup(script.isGroup || false)
    setSelectedParentId(script.parentId || null)
    setShowEditDialog(true)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* App Bar */}
        <AppBar position="fixed">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setShowDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Teleprompter
            </Typography>
            {showPrompter && (
              <>
                <IconButton color="inherit" onClick={jumpToStart}>
                  <SkipPrevious />
                </IconButton>
                <IconButton
                  color="inherit"
                  onClick={() => setIsScrolling(!isScrolling)}
                  sx={{
                    bgcolor: isScrolling ? 'error.main' : 'success.main',
                    mr: 1,
                    '&:hover': {
                      bgcolor: isScrolling ? 'error.dark' : 'success.dark',
                    },
                  }}
                >
                  {isScrolling ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton color="inherit" onClick={jumpToEnd}>
                  <SkipNext />
                </IconButton>
              </>
            )}
            {showPrompter && (
              <>
                <IconButton color="inherit" onClick={() => setShowSettingsDialog(true)}>
                  <Settings />
                </IconButton>
                <IconButton color="inherit" onClick={() => setShowPrompter(false)}>
                  <Close />
                </IconButton>
              </>
            )}
          </Toolbar>
        </AppBar>

        {!showPrompter ? (
          /* Script Manager */
          <Container maxWidth="md" sx={{ flexGrow: 1, py: 3, overflow: 'auto', mt: 8 }}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    {currentGroupId && (
                      <IconButton onClick={() => setCurrentGroupId(null)} size="small">
                        <ArrowBack />
                      </IconButton>
                    )}
                    <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                      {currentGroupId 
                        ? scripts.find(s => s.id === currentGroupId)?.name || 'Group'
                        : 'My Scripts'
                      }
                    </Typography>
                  </Stack>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={newScript}
                    size="large"
                  >
                    Create New Script
                  </Button>
                </CardContent>
              </Card>

              {scripts.filter(s => s.parentId === currentGroupId).length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography variant="body1" color="text.secondary" align="center">
                      {currentGroupId ? 'No scripts in this group yet.' : 'No scripts yet. Create your first script!'}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                scripts
                  .filter(s => s.parentId === currentGroupId)
                  .map((script) => {
                    const childCount = script.isGroup 
                      ? scripts.filter(s => s.parentId === script.id).length 
                      : 0
                    
                    return (
                      <Card key={script.id}>
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {script.isGroup && <Folder color="primary" />}
                            <Typography variant="h6" gutterBottom sx={{ mb: 0, flexGrow: 1 }}>
                              {script.name}
                            </Typography>
                            {script.isGroup && (
                              <Chip label={`${childCount} script${childCount !== 1 ? 's' : ''}`} size="small" />
                            )}
                          </Stack>
                          {!script.isGroup && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {script.content.substring(0, 100)}{script.content.length > 100 ? '...' : ''}
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            startIcon={script.isGroup ? <Folder /> : <PlayArrow />}
                            onClick={() => loadScript(script)}
                            variant="contained"
                            color="primary"
                          >
                            {script.isGroup ? 'Open' : 'Load'}
                          </Button>
                          {!script.isGroup && (
                            <Button
                              startIcon={<Edit />}
                              onClick={() => editScript(script)}
                              variant="outlined"
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            startIcon={<Delete />}
                            onClick={() => deleteScript(script.id)}
                            color="error"
                          >
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    )
                  })
              )}
            </Stack>
          </Container>
        ) : (
          /* Prompter View */
          <>
            <Box
              ref={scrollContainerRef}
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 3,
                pt: 'calc(50vh + 64px)',
                pb: '50vh',
                transform: `${isReversed ? 'scaleX(-1)' : ''} ${isFlippedVertically ? 'scaleY(-1)' : ''}`.trim() || 'none',
              }}
            >
              <Container maxWidth="md">
                <Typography
                  sx={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    textAlign: textAlign,
                  }}
                >
                  {text}
                </Typography>
              </Container>
            </Box>
            
            {/* Eye Level Guide Line */}
            <Box
              sx={{
                position: 'fixed',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: 'red',
                zIndex: 1000,
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* Scripts Drawer */}
        <Drawer
          anchor="left"
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
        >
          <Box sx={{ width: 300, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Scripts
            </Typography>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={newScript}
              sx={{ mb: 2 }}
            >
              New Script
            </Button>
            <Divider sx={{ mb: 2 }} />
            <List>
              {scripts.map((script) => (
                <ListItem
                  key={script.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => deleteScript(script.id)}
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => loadScript(script)}>
                    <ListItemText
                      primary={script.name}
                      secondary={`${script.content.substring(0, 30)}...`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* New Script Dialog */}
        <Dialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false)
            setSelectedParentId(null)
            setIsCreatingGroup(false)
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{editingScript ? (editingScript.isGroup ? 'Edit Group' : 'Edit Script') : 'New Script'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={editingScript?.isGroup ? "Group Name" : "Script Name"}
              fullWidth
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            {!editingScript && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isCreatingGroup}
                      onChange={(e) => {
                        setIsCreatingGroup(e.target.checked)
                        if (e.target.checked) {
                          setSelectedParentId(null)
                          setText('')
                        }
                      }}
                    />
                  }
                  label="Create as group (folder for multiple scripts)"
                  sx={{ mb: 2 }}
                />
                
                {!isCreatingGroup && (
                  <>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Add to Group (optional)
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      value={selectedParentId || ''}
                      onChange={(e) => setSelectedParentId(e.target.value || null)}
                      SelectProps={{ native: true }}
                      sx={{ mb: 2 }}
                    >
                      <option value="">None - Standalone Script</option>
                      {scripts.filter(s => s.isGroup && (!currentGroupId || s.id === currentGroupId)).map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </TextField>
                  </>
                )}
              </>
            )}
            
            {!isCreatingGroup && !editingScript?.isGroup && (
              <TextField
                margin="dense"
                label="Script Content"
                fullWidth
                multiline
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShowEditDialog(false)
              setSelectedParentId(null)
              setIsCreatingGroup(false)
            }}>Cancel</Button>
            <Button onClick={saveScript} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog
          open={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography>Scroll Speed</Typography>
                <Chip label={scrollSpeed} size="small" color="primary" />
              </Stack>
              <Slider
                value={scrollSpeed}
                onChange={(_, val) => setScrollSpeed(val)}
                onChangeCommitted={(_, val) => setScrollSpeed(val)}
                min={0.1}
                max={5}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
              
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, mt: 3 }}>
                <Typography>Font Size</Typography>
                <Chip label={`${fontSize}px`} size="small" color="primary" />
              </Stack>
              <Slider
                value={fontSize}
                onChange={(_, val) => setFontSize(val)}
                onChangeCommitted={(_, val) => setFontSize(val)}
                min={16}
                max={64}
                step={4}
                marks
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom sx={{ mt: 3 }}>
                Text Alignment
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant={textAlign === 'left' ? 'contained' : 'outlined'}
                  onClick={() => setTextAlign('left')}
                  startIcon={<FormatAlignLeft />}
                >
                  Left
                </Button>
                <Button
                  variant={textAlign === 'center' ? 'contained' : 'outlined'}
                  onClick={() => setTextAlign('center')}
                  startIcon={<FormatAlignCenter />}
                >
                  Center
                </Button>
                <Button
                  variant={textAlign === 'right' ? 'contained' : 'outlined'}
                  onClick={() => setTextAlign('right')}
                  startIcon={<FormatAlignRight />}
                >
                  Right
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={isDarkMode}
                    onChange={(e) => setIsDarkMode(e.target.checked)}
                  />
                }
                label="Dark Mode"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isReversed}
                    onChange={(e) => setIsReversed(e.target.checked)}
                  />
                }
                label="Mirror Horizontally"
                sx={{ mt: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isFlippedVertically}
                    onChange={(e) => setIsFlippedVertically(e.target.checked)}
                  />
                }
                label="Mirror Vertically"
                sx={{ mt: 1 }}
              />

              {currentScript && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={updateScript}
                  sx={{ mt: 3 }}
                >
                  Update Current Script
                </Button>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSettingsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default App
