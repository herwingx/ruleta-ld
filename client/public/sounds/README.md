# 🔊 Carpeta de Sonidos Navideños

Esta carpeta está destinada para los archivos de audio personalizados de tu ruleta navideña.

## 📁 Archivos Recomendados

Coloca aquí los siguientes archivos de audio (formato `.mp3` o `.wav`):

| Archivo | Descripción | Cuándo suena |
|---------|-------------|--------------|
| `hohoho.mp3` | Risa de Santa Claus "HO HO HO" | Durante el giro de la ruleta |
| `jingle.mp3` | Campanillas navideñas | Cuando se revela el ganador |
| `win.mp3` | Sonido de victoria/celebración | Al terminar el giro |
| `spin.mp3` | Sonido de ruleta girando | Mientras gira la ruleta |

## 🎵 Dónde Encontrar Sonidos Gratuitos

1. **Pixabay** - https://pixabay.com/sound-effects/
   - Busca: "christmas bells", "santa laugh", "celebration"

2. **Freesound** - https://freesound.org/
   - Busca: "ho ho ho", "jingle bells", "christmas"

3. **Mixkit** - https://mixkit.co/free-sound-effects/
   - Categoría: Holidays & Events

## 🔧 Cómo Usar Sonidos Locales

Si prefieres usar archivos locales en lugar de URLs externas, modifica el hook `useSantaSound.ts`:

```typescript
// En src/hooks/useSantaSound.ts
// Cambia las URLs a rutas locales:

const SOUNDS = {
  hohoho: '/sounds/hohoho.mp3',
  jingle: '/sounds/jingle.mp3',
  win: '/sounds/win.mp3',
  spin: '/sounds/spin.mp3',
};
```

## 📝 Notas

- Los archivos de audio deben ser cortos (2-5 segundos idealmente)
- Formatos soportados: `.mp3`, `.wav`, `.ogg`
- Asegúrate de que los archivos tengan derechos de uso libre o licencia apropiada
