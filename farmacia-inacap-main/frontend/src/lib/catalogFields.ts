import type { ActionField } from "../components/ui/ActionModal";

/** Campos para crear o editar una categoría de productos. */
export const categoryFields: ActionField[] = [
  {
    name: "name",
    label: "Nombre de la categoría",
    required: true,
    minLength: 2,
    maxLength: 150,
    example: "Analgésicos y antifebriles",
    placeholder: "Ej.: Analgésicos y antifebriles (de 2 a 150 car.)",
    hint: "Cómo quieres que aparezca en las listas y filtros.",
    help: "La categoría agrupa productos parecidos para encontrarlos más rápido. Usa un nombre que cualquier persona del equipo entienda, por ejemplo «Vitaminas», «Higiene bucal» o «Cuidado del bebé».",
  },
  {
    name: "code",
    label: "Código corto",
    required: true,
    minLength: 2,
    maxLength: 50,
    example: "ANALG",
    placeholder: "Ej.: ANALG (de 2 a 50 car.)",
    hint: "Abreviatura única, de 2 letras o números como mínimo. Se guarda en mayúsculas.",
    help: "No viene en ningún envase: lo defines tú. Sirve para identificar la categoría en el sistema y en reportes. Usa algo corto, sin espacios, que no se repita con otra categoría.",
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    maxLength: 255,
    example: "Medicamentos para aliviar el dolor y bajar la fiebre",
    placeholder: "Ej.: Medicamentos para aliviar el dolor y bajar fiebre (máx. 255 car.)",
    hint: "Ayuda a decidir qué productos van aquí.",
  },
];

/** Campos para crear o editar un laboratorio o marca. */
export const laboratoryFields: ActionField[] = [
  {
    name: "name",
    label: "Nombre del laboratorio o marca",
    required: true,
    minLength: 2,
    maxLength: 150,
    example: "Laboratorio Chile",
    placeholder: "Ej.: Laboratorio Chile (de 2 a 150 car.)",
    hint: "Escríbelo como aparece en el envase.",
    help: "Es la empresa que fabrica o distribuye el producto. Suele aparecer en la parte de atrás o en un costado del envase, cerca de la dirección del fabricante. En productos que no son medicamentos puede ser la marca.",
  },
  {
    name: "code",
    label: "Código corto",
    required: true,
    minLength: 2,
    maxLength: 50,
    example: "LABCHI",
    placeholder: "Ej.: LABCHI (de 2 a 50 car.)",
    hint: "Abreviatura única, de 2 letras o números como mínimo. Se guarda en mayúsculas.",
    help: "No viene en el envase: lo defines tú para identificar al laboratorio en el sistema. Usa algo corto, sin espacios, que no se repita con otro laboratorio.",
  },
  {
    name: "description",
    label: "Descripción",
    type: "textarea",
    maxLength: 255,
    example: "Fabricante nacional de medicamentos genéricos",
    hint: "Notas internas sobre el laboratorio. Máximo 255 caracteres.",
  },
];
