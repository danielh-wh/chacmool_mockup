from pydantic import BaseModel, Field
from typing import List, Optional, Literal


QuestionType = Literal["seleccion", "multiple", "abierta"]


class ClimaOptionIn(BaseModel):
    titulo: str = Field(min_length=1, max_length=255)
    valor: int = Field(ge=1, le=5)


class ClimaQuestionIn(BaseModel):
    pregunta: str = Field(min_length=1)
    tipo: QuestionType
    opciones: List[ClimaOptionIn] = []


class ClimaSurveyCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
    descripcion: Optional[str] = ""
    fecha_fin: str
    es_anonima: bool = True
    meta_participacion: int = Field(default=0, ge=0)
    meta_satisfaccion: int = Field(default=80, ge=0, le=100)
    preguntas: List[ClimaQuestionIn]


class ClimaTemplateCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
    descripcion: Optional[str] = ""
    preguntas: List[ClimaQuestionIn]
