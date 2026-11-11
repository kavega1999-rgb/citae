# CITAE para múltiples negocios de citas

## Resultado
Cualquier negocio de citas o profesional independiente podrá crear su cuenta, configurar su negocio y compartir su propio enlace de reservas. El acceso no requerirá aprobación del propietario de CITAE; se respetarán las verificaciones de correo que tenga configuradas Supabase.

## Registro y configuración
- Añadir registro e inicio de sesión con correo y contraseña.
- Después de entrar, solicitar nombre del negocio, tipo de actividad y si trabaja como negocio o profesional independiente.
- Crear el negocio y su administrador conjuntamente, sin asignar permisos a partir de información editable de la cuenta.
- Permitir configurar servicios, precios, duración, horarios, anticipo, medios de pago y política de cancelación con valores proporcionados por el administrador.
- Empezar con una agenda por negocio, válida también para un profesional independiente. No añadir agendas separadas para múltiples profesionales en esta entrega.

## Enlace para clientes
- Generar una dirección única como `/agendar/nombre-del-negocio` y ofrecer copiar el enlace desde Configuración.
- Mostrar únicamente la identidad, los servicios y los horarios del negocio elegido.
- Mantener el flujo existente de reserva, anticipo, comprobante privado y seguimiento.
- Mantener las confirmaciones personalizables por WhatsApp.
- No incluir claves de acceso a reservas en los enlaces compartidos.

## Protección del negocio actual
- Conservar las citas, los clientes, los servicios, los pagos y los comprobantes existentes dentro del negocio piloto.
- Conservar el acceso de sus administradores actuales.
- Mantener `/agendar` compatible con el negocio piloto, sin convertirlo en un catálogo mezclado de negocios.
- Separar completamente los datos y permisos de cada negocio: registrarse no concede acceso al negocio piloto ni a otros negocios.

## Detalles técnicos
- Migrar la configuración actual de negocio único en el Supabase existente; no crear otro proyecto.
- Añadir negocios y membresías protegidas; vincular los registros operativos con su negocio.
- Sustituir los permisos globales basados en `profiles.role` por membresías del negocio, verificadas en el servidor y mediante RLS.
- Actualizar conjuntamente los permisos, las relaciones entre registros y las reglas que impiden solapamientos; dos negocios podrán tener citas a la misma hora.
- Adaptar las RPC existentes para identificar el negocio: `get_public_services`, `get_public_booking_settings`, `get_available_slots` y `create_public_appointment_v2`. Mantener los precios y la disponibilidad como reglas de Supabase.
- Revisar también aprobación/rechazo de anticipos, lectura de comprobantes, recuperación de reservas y todos los caminos públicos para evitar accesos entre negocios.
- Separar las claves de React Query y el acceso guardado a reservas por negocio.
- Aplicar los cambios de Supabase exclusivamente mediante migraciones y conservar secretos en el servidor.

## Comprobaciones
- Pruebas de registro y creación conjunta del negocio y su administrador.
- Pruebas con dos negocios: lectura y modificación cruzadas denegadas, servicios y horarios separados y reservas simultáneas permitidas entre negocios.
- Verificar el recorrido registro → configuración → copiar enlace → reserva del cliente → comprobante → aprobación → confirmación.
- Revisar computador y celular y ejecutar las pruebas existentes.
- La comprobación real autenticada depende del acceso de prueba disponible en el Supabase externo; no crear reservas ficticias en el negocio piloto.

## Fuera de alcance
Ventas, pedidos, suscripciones de pago de CITAE y envío automático mediante WhatsApp Business.