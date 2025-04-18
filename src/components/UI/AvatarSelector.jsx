import React from 'react';
import PropTypes from 'prop-types';
import AvatarPreview3D from '../AvatarPreview3D.jsx';

function getLabelFromFilename(filename) {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function AvatarSelector({ avatars, selectedAvatar, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
      {avatars.map(avatarObj => {
        const label = avatarObj.name || getLabelFromFilename(avatarObj.file);
        return (
          <div key={avatarObj.file} style={{ textAlign: 'center' }}>
            <AvatarPreview3D
              modelUrl={`/models/avatars/${avatarObj.file}`}
              selected={selectedAvatar === avatarObj.file}
              onClick={() => onSelect(avatarObj.file)}
            />
            <div style={{ marginTop: 8, fontWeight: selectedAvatar === avatarObj.file ? 'bold' : 'normal' }}>{label}</div>
          </div>
        );
      })}
    </div>
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
