# Pols Icons

Herramienta CLI para crear fuentes de íconos. **Pols Icons** entrega una carpeta con la fuente lista para distribuir.

Basado en el paquete `icon.font`.

## Instalación

```
npm install -g pols-icons
```

## Crear un nuevo proyecto

Ubique el promt en su directorio de trabajo. De preferencia escoja un directorio vacío. Luego de ello ejecute:

```
pols-icons create my-font
```

Con ello se habrán creado el archivo de configuración `config.js` y un subdirectorio de nombre `icons` en el cual tendrá que colocar todos sus archivos `.svg`.

## Distribución de la fuente

Para crear los archivos de distribución de la fuente ejecute:

pols-icons compile

Con ellos se habrá creado un subdirectorio de nombre dist que contiene lo siguiente:

```
│   index.html
└───my-font
        my-font.css
        my-font.eot
        my-font.svg
        my-font.ttf
        my-font.woff
        my-font.woff2
```

El archivo `index.html` es un instructivo de cómo utilizar la fuente. El subdirectorio `my-font` (para este ejemplo, ya que se mostrará con el nombre que usted haya especificado) tiene el contenido que podrá distribuir.
