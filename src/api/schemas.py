from pydantic import BaseModel

class RelatedArticleDTO(BaseModel):
    id: int
    url: str
    title: str
    site_name: str
    diff: str
