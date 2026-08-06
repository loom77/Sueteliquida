import React from 'react';
import { PrimyMascotAvatar, PrimyMascotGraphic } from './BrandVisuals.jsx';

export const MASCOT_ROLES = Object.freeze({
  companion: {
    variant: 'welcome',
    label: 'Primy te acompaña',
    defaultCaption: 'Tu espacio, a tu manera.',
  },
  guide: {
    variant: 'helper',
    label: 'Primy te guía',
    defaultCaption: 'Estoy aquí para ayudarte paso a paso.',
  },
  welcome: {
    variant: 'welcome',
    label: 'Primy te da la bienvenida',
    defaultCaption: '¿Empezamos?',
  },
  thinking: {
    variant: 'thinking',
    label: 'Primy está preparando la jugada',
    defaultCaption: 'Estoy revisando los detalles de tu jugada.',
  },
  confirmation: {
    variant: 'celebration',
    label: 'Primy confirma que todo está listo',
    defaultCaption: 'Todo listo.',
  },
  responsible: {
    variant: 'responsible',
    label: 'Primy te recuerda tus límites',
    defaultCaption: 'Juega solo lo que habías previsto.',
  },
  empty: {
    variant: 'empty',
    label: 'Primy te acompaña en un estado vacío',
    defaultCaption: 'Todavía no hay nada aquí.',
  },
});

export function PrimyMascot({
  role = 'guide',
  caption,
  protagonist = true,
  className = '',
  ...props
}) {
  const config = MASCOT_ROLES[role] || MASCOT_ROLES.guide;
  if (!protagonist) {
    return (
      <span className={`primy-mascot-role primy-mascot-role--avatar ${className}`} data-mascot-role={role} aria-label={config.label}>
        <PrimyMascotAvatar className="h-full w-full" />
      </span>
    );
  }
  return (
    <div className="primy-mascot-role" data-mascot-role={role}>
      <PrimyMascotGraphic
        variant={config.variant}
        caption={caption || config.defaultCaption}
        className={className}
        {...props}
      />
    </div>
  );
}
