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
  SwapVert
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
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showPrompter, setShowPrompter] = useState(false)
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
    if (!scriptName.trim() || !text.trim()) return
    
    const newScript = {
      id: Date.now(),
      name: scriptName,
      content: text,
    }
    
    setScripts([...scripts, newScript])
    setScriptName('')
    setShowEditDialog(false)
  }

  const loadScript = (script) => {
    setCurrentScript(script)
    setText(script.content)
    setShowDrawer(false)
    setShowPrompter(true)
  }

  const deleteScript = (id) => {
    setScripts(scripts.filter(s => s.id !== id))
    if (currentScript?.id === id) {
      setCurrentScript(null)
      setText('')
    }
  }

  const updateScript = () => {
    if (!currentScript || !text.trim()) return
    
    setScripts(scripts.map(s => 
      s.id === currentScript.id 
        ? { ...s, content: text }
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
    setText('')
    setScriptName('')
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
                  <Typography variant="h5" gutterBottom>
                    My Scripts
                  </Typography>
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

              {scripts.length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No scripts yet. Create your first script!
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                scripts.map((script) => (
                  <Card key={script.id}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {script.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {script.content.substring(0, 100)}...
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        startIcon={<PlayArrow />}
                        onClick={() => loadScript(script)}
                        variant="contained"
                        color="primary"
                      >
                        Load
                      </Button>
                      <Button
                        startIcon={<Delete />}
                        onClick={() => deleteScript(script.id)}
                        color="error"
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                ))
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
          onClose={() => setShowEditDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>New Script</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Script Name"
              fullWidth
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Script Content"
              fullWidth
              multiline
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
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
              <Typography gutterBottom>
                Scroll Speed
              </Typography>
              <Slider
                value={scrollSpeed}
                onChange={(_, val) => setScrollSpeed(val)}
                min={0.1}
                max={5}
                step={0.1}
                marks
                valueLabelDisplay="auto"
              />
              
              <Typography gutterBottom sx={{ mt: 3 }}>
                Font Size
              </Typography>
              <Slider
                value={fontSize}
                onChange={(_, val) => setFontSize(val)}
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
