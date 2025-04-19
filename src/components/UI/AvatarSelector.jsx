import React from 'react';
import PropTypes from 'prop-types';
import AvatarPreview3D from '../AvatarPreview3D.jsx';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

function getLabelFromFilename(filename) {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function AvatarSelector({ avatars, selectedAvatar, onSelect }) {
  return (
    <Stack direction="row" spacing={3} mt={1}>
      {avatars.map(avatarObj => {
        const label = avatarObj.name || getLabelFromFilename(avatarObj.file);
        return (
          <Stack key={avatarObj.file} alignItems="center">
            <AvatarPreview3D
              modelUrl={`/models/avatars/${avatarObj.file}`}
              selected={selectedAvatar === avatarObj.file}
              onClick={() => onSelect(avatarObj.file)}
            />
            <Typography mt={1} fontWeight={selectedAvatar === avatarObj.file ? 'bold' : 'normal'}>
              {label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

AvatarSelector.propTypes = {
  avatars: PropTypes.arrayOf(PropTypes.shape({
    file: PropTypes.string.isRequired,
    name: PropTypes.string,
  })).isRequired,
  selectedAvatar: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};
