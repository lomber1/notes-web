import React, { useCallback, useEffect, useState } from 'react';
import {
  AppBar,
  Button,
  debounce,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps, IconButton, Menu, Stack, Theme, Toolbar, Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import NoteForm from '../Note/NoteForm';
import useNotesTheme from '../../context/themeHooks';
import BackButton from '../BackButton';
import useMatchesDesktop from '../../hooks/useMatchesDesktop';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import CircleIcon from '@mui/icons-material/Circle';
import {
  useAddNoteMutation,
  useArchiveNoteMutation,
  useRemoveNoteMutation, useUnArchiveNoteMutation, useUpdateColorMutation,
  useUpdateNoteMutation
} from '../../api/api';
import { NoteColors } from '../../theme';

export interface NoteFormDialogProps extends DialogProps {
  onClose: () => void;
  note? :INote;
}

const bgClr = (color: string, theme: Theme) => `note${color}.${theme.palette.mode}`

const NoteFormDialog: React.FC<NoteFormDialogProps> = ({ note, open, onClose, ...props }) => {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [noteId, setNoteId] = useState(note?.id);
  const [createNote, setCreateNote] = useState<ICreateNote | null>();

  const { theme } = useNotesTheme();
  const matchesDesktop = useMatchesDesktop();

  // Color menu
  const [colorMenuAnchorEl, setColorMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const colorMenuOpen = Boolean(colorMenuAnchorEl);
  const [color, setColor] = useState(note?.color || 'Yellow');

  const [
    addNote,
  ] = useAddNoteMutation();

  const [
    updateNote,
  ] = useUpdateNoteMutation();

  const [
    removeNote,
  ] = useRemoveNoteMutation();

  const [
    archiveNote,
  ] = useArchiveNoteMutation();

  const [
    unArchiveNote,
  ] = useUnArchiveNoteMutation();

  const [
    updateColor,
  ] = useUpdateColorMutation();

  useEffect(() => {
    setNoteId(note?.id);

    if (open) {
      setColor(note?.color || 'Yellow');
    }
  }, [open]);

  const handleDebounceChange = (createNote: ICreateNote) => {
    if (!noteId) {
      addNote({
        ...createNote,
        color: color,
      })
        .unwrap()
        .then((note) => {
          setNoteId(note.id);
        })
        .catch((rejected) => {
          enqueueSnackbar(t('snack.create.error'), {
            preventDuplicate: true,
          });
        });
    } else {
      updateNote({
        ...createNote,
        id: noteId,
        color: color,
      })
        .unwrap()
        .then((_) => {})
        .catch((rejected) => {
          enqueueSnackbar(t('snack.update.error'), {
            preventDuplicate: true,
          });
        });
    }
  }

  const debounceChange = useCallback(debounce(handleDebounceChange, 300), [noteId, color]);

  const handleOnNoteChange = (createNote: ICreateNote) => {
    setCreateNote(createNote);
    // debounceChange(createNote);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleNoteSave = () => {
    if (!createNote) return;

    handleDebounceChange(createNote);
    handleClose();
  };

  const handleArchive = () => {
    if (!noteId) return;

    handleClose();
    archiveNote(noteId)
      .unwrap()
      .then(() => {
        enqueueSnackbar(t('snack.archive.success'), {
          preventDuplicate: true,
        });
      })
      .catch((e) => {
        enqueueSnackbar(t('snack.archive.error'), {
          preventDuplicate: true,
        });
      });
  };

  const handleUnArchive = () => {
    if (!noteId) return;

    handleClose();
    unArchiveNote(noteId)
      .unwrap()
      .then(() => {
        enqueueSnackbar(t('snack.unarchive.success'), {
          preventDuplicate: true,
        });
      })
      .catch((e) => {
        enqueueSnackbar(t('snack.unarchive.error'), {
          preventDuplicate: true,
        });
      });
  };

  const handleDelete = () => {
    if (!noteId) return;

    handleClose();
    removeNote(noteId)
      .unwrap()
      .then(() => {
        enqueueSnackbar(t('snack.remove.success'), {
          preventDuplicate: true,
        });
      })
      .catch((e) => {
        enqueueSnackbar(t('snack.remove.error'), {
          preventDuplicate: true,
        });
      });
  };

  const handleOpenColorMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setColorMenuAnchorEl(event.currentTarget);
  };

  const handleCloseColorMenu = () => {
    setColorMenuAnchorEl(null);
  };

  const handleColor = (color: NoteColor) => () => {
    setColor(color);
    setColorMenuAnchorEl(null);

    if (!noteId) return;

    updateColor({ id: noteId, color })
      .unwrap()
      .then(() => {})
      .catch((e) => {
        enqueueSnackbar(t('snack.update.error'), {
          preventDuplicate: true,
        });
      })
  };

  const renderToolbar = () => (
    <>
      {/* Delete button */}
      <Tooltip title={t('tooltip.delete') as string}>
        <IconButton onClick={handleDelete}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>

      {(!note || !note.isArchived) ? (
        <Tooltip title={t('tooltip.archive') as string}>
          <IconButton onClick={handleArchive}>
            <ArchiveIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={t('tooltip.unarchive') as string}>
        <IconButton onClick={handleUnArchive}>
        <UnarchiveIcon />
        </IconButton>
        </Tooltip>
      )}

      {/* Color button */}
      <Tooltip title={t('tooltip.color') as string}>
        <IconButton onClick={handleOpenColorMenu}>
          <PaletteIcon />
        </IconButton>
      </Tooltip>
    </>
  );

  const renderSaveButton = () => (
    <Button
      autoFocus
      onClick={handleNoteSave}
      color="inherit"
      disabled={!createNote || (createNote.title === '' && createNote.body === '')}
    >
      {t('dialog.save')}
    </Button>
  );

  const renderAppBarOnMobile = () => (
    !matchesDesktop && (
      <AppBar
        elevation={0}
        sx={(theme) => ({
          position: 'relative',
          bgcolor: bgClr(color, theme),
        })}
      >
        <Toolbar disableGutters sx={{ marginX: 1 }}>
          <BackButton onClick={onClose} />

          {/* used for making icons appear on the right */}
          <div style={{ display: 'flex', flex: 1 }}/>

          {renderSaveButton()}

        </Toolbar>
      </AppBar>
    )
  );

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      fullScreen={!matchesDesktop}
      onClose={onClose}
      open={open}
      {...props}
    >
      {renderAppBarOnMobile()}

      <DialogContent
        sx={(theme) => ({
          padding: 2,
          bgcolor: bgClr(color, theme),
        })}
      >
        <NoteForm note={note} onChange={handleOnNoteChange} />
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          bgcolor: bgClr(color, theme),
        })}
      >
        {renderToolbar()}

        {/* used for making icons appear on the left */}
        <div style={{ display: 'flex', flex: 1 }}/>

        {matchesDesktop && (
          <>
            {/* Close button */}
            <Button
              autoFocus
              onClick={handleClose}
              color="inherit"
            >
              {t('dialog.close')}
            </Button>

            {/* Save button */}
            {renderSaveButton()}
          </>
        )}

      </DialogActions>

      <Menu
        anchorEl={colorMenuAnchorEl}
        open={colorMenuOpen}
        onClose={handleCloseColorMenu}
      >
        <Stack
          direction="row"
          sx={{
            px: 1,
          }}
        >
          {Object.entries(NoteColors).map(([key , value]) => (
            <IconButton
              key={`color-${key}`}
              sx={{
                p: 0
              }}
              onClick={handleColor(key as NoteColor)}
            >
              <CircleIcon
                sx={(theme) => ({
                  color: `note${key}.${theme.palette.mode}`,
                  fontSize: 40,
                })}
              />
            </IconButton>
          ))}
        </Stack>
      </Menu>
   </Dialog>
  );
};

export default NoteFormDialog;
