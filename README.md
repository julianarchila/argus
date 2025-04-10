# News Scrapper

Este proyecto es un scrapper de noticias diseñado para extraer artículos y feeds RSS de sitios web de noticias. Actualmente, está configurado para trabajar con el sitio web de El Tiempo.

## Estructura del Proyecto

El proyecto está organizado en los siguientes directorios:

- `src/article_parser`: Contiene los parsers para extraer artículos de sitios web de noticias.
  - `base.py`: Define la clase base `ArticleParser` y el dataclass `Article`.
  - `eltiempo.py`: Implementación concreta de `ArticleParser` para el sitio web de El Tiempo.

- `src/feed_parser`: Contiene los parsers para extraer feeds RSS de sitios web de noticias.
  - `base.py`: Define la clase base `RSSFeedParser` y el dataclass `FeedItem`.
  - `eltiempo.py`: Implementación concreta de `RSSFeedParser` para el feed RSS de El Tiempo.

- `src/database`: Contiene la lógica para guardar artículos y rastrear fechas de procesamiento.
  - `db.py`: Implementa funciones para interactuar con la base de datos SQLite.

- `main.py`: Punto de entrada principal que utiliza el sistema de registro para procesar múltiples sitios de noticias.

## Arquitectura del Sistema

El proyecto utiliza un patrón de registro (registry pattern) para facilitar la incorporación de nuevos sitios de noticias. Esta arquitectura está compuesta por:

- `NewsRegistry`: Clase que gestiona el registro de configuraciones para diferentes sitios de noticias.
- `NewsSiteConfig`: Clase que encapsula toda la información necesaria para un sitio de noticias específico.
- Base de datos SQLite para almacenamiento persistente de artículos y seguimiento de las fechas de último procesamiento.
- Funciones utilitarias para procesar todos los sitios registrados o sitios específicos.

## Base de Datos

El sistema utiliza SQLite para almacenar:

1. **Artículos**: Todos los artículos extraídos, con un campo `site_name` que identifica el sitio de origen.
2. **Seguimiento de sitios**: Almacena la última fecha de procesamiento para cada sitio, permitiendo procesar solo contenido nuevo en ejecuciones posteriores.

La base de datos se inicializa automáticamente al ejecutar el programa.

## Uso del Sistema

Para ejecutar el scrapper y procesar todos los sitios de noticias registrados:

```bash
python main.py
```

Esto procesará automáticamente todos los sitios configurados en el registro, extrayendo solo los artículos nuevos desde la última ejecución y los guardará en la base de datos.

## Cómo Añadir un Nuevo Sitio de Noticias

Para añadir un nuevo sitio de noticias al sistema, sigue estos pasos:

1. Implementa un `ArticleParser` para el sitio (ver sección "Guía para Implementar un Article Parser").
2. Implementa un `RSSFeedParser` para el sitio (ver sección "Guía para Implementar un Feed Parser").
3. Registra el nuevo sitio en la función `register_default_sites` en `main.py`:

```python
registry.register_site(
    NewsSiteConfig(
        name="nombre_del_sitio",
        feed_url="https://tu-sitio-noticias.com/feed.xml",
        feed_parser_class=TuSitioFeedParser,
        article_parser_class=TuSitioArticleParser
    )
)
```

Solo con estos tres pasos, el nuevo sitio de noticias se integrará completamente en el sistema y será procesado automáticamente al ejecutar `main.py`.

## Guía para Implementar un Article Parser

Para implementar un `ArticleParser` para otro sitio de noticias, sigue estos pasos:

1. Crea un nuevo archivo en `src/article_parser` (por ejemplo, `otro_sitio.py`).
2. Hereda de la clase `ArticleParser` definida en `base.py`.
3. Implementa los métodos abstractos `fetch` y `extract_content`.
   - `fetch`: Realiza una solicitud HTTP para obtener el contenido de la página web y devuelve un objeto `BeautifulSoup`.
   - `extract_content`: Extrae el contenido del artículo del objeto `BeautifulSoup` y devuelve un objeto `Article`.

Ejemplo:
```python
from .base import ArticleParser, Article
from bs4 import BeautifulSoup
import requests

class OtroSitioArticleParser(ArticleParser):
    def fetch(self) -> BeautifulSoup:
        response = requests.get(self.url)
        return BeautifulSoup(response.content, "html.parser")

    def extract_content(self, soup: BeautifulSoup) -> Article:
        # Implementa la lógica para extraer el contenido del artículo
        return Article(url=self.url, text="Texto del artículo", markdown="Markdown del artículo")
```

4. Actualiza el archivo `__init__.py` en el directorio `src/article_parser` para exportar tu nueva clase:

```python
from .eltiempo import ElTiempoArticleParser
from .otro_sitio import OtroSitioArticleParser
```

## Guía para Implementar un Feed Parser

Para implementar un `RSSFeedParser` para otro sitio de noticias, sigue estos pasos:

1. Crea un nuevo archivo en `src/feed_parser` (por ejemplo, `otro_sitio.py`).
2. Hereda de la clase `RSSFeedParser` definida en `base.py`.
3. Implementa el método abstracto `parse_feed`.
   - `parse_feed`: Parsea el contenido del feed RSS y devuelve una secuencia de objetos `FeedItem`.

Ejemplo:
```python
from .base import RSSFeedParser, FeedItem
from typing import Sequence
from bs4 import BeautifulSoup
from datetime import datetime

class OtroSitioRSSParser(RSSFeedParser):
    def parse_feed(self, tree: BeautifulSoup) -> Sequence[FeedItem]:
        # Implementa la lógica para parsear el feed RSS
        items = []
        # ... tu código para extraer elementos del feed ...
        return items
```

4. Actualiza el archivo `__init__.py` en el directorio `src/feed_parser` para exportar tu nueva clase:

```python
from .eltiempo import ElTiempoRSSParser
from .otro_sitio import OtroSitioRSSParser
```

## Procesamiento de Sitios Específicos

Si deseas procesar solo un sitio específico en lugar de todos los sitios registrados, puedes modificar el bloque principal en `main.py`:

```python
if __name__ == "__main__":
    init_db()  # Siempre inicializa la base de datos
    registry = NewsRegistry()
    register_default_sites(registry)
    
    # Procesar un sitio específico por nombre
    process_site(registry, "nombre_del_sitio")
```

## Configuración del Entorno Virtual y Instalación de Paquetes

1. Crea un entorno virtual:
   ```bash
   python3 -m venv venv
   ```

2. Activa el entorno virtual:
   - En Linux/Mac:
     ```bash
     source venv/bin/activate
     ```
   - En Windows:
     ```bash
     .\venv\Scripts\activate
     ```

3. Instala los paquetes necesarios:
   ```bash
   pip install -r requirements.txt
   ```

## Estructura de la Base de Datos

La base de datos SQLite tiene las siguientes tablas:

### Tabla `articles`
- `id`: Identificador único del artículo
- `url`: URL única del artículo (clave única)
- `title`: Título del artículo
- `text`: Texto completo del artículo
- `markdown`: Texto en formato markdown
- `author`: Autor del artículo
- `date`: Fecha del artículo
- `publication_date`: Fecha de publicación (del feed)
- `lastmod`: Fecha de última modificación (del feed)
- `site_name`: Nombre del sitio de origen
- `keywords`: Palabras clave (almacenadas como JSON)
- `created_at`: Fecha y hora de inserción en la base de datos

### Tabla `site_tracking`
- `site_name`: Nombre único del sitio (clave primaria)
- `last_processed`: Última fecha de procesamiento del sitio
