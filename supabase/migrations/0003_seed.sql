-- Masters: máquinas (idénticas a index.html / Vista A)
insert into maquina (id, nombre, ratio_ideal) values
  ('H1','Haver 1',2400),('H2','Haver 2',3600),('H3','Haver 3',3900),
  ('H4','Haver 4',3900),('H5','Haver 5',3900),('V','Ventomatic',4300)
on conflict (id) do nothing;

-- Masters: temporales
insert into temporal (nombre, capacidad) values
  ('Temporal 1',2142),('Temporal 2',1890),('Misti',3006)
on conflict (nombre) do nothing;

-- Tipos de cemento con familia + presentación
insert into tipo_cemento (nombre, familia, presentacion, peso_kg, orden) values
  ('CEM. FRONTERA GU X 42.5 KG','GU','bolsa42.5',42.5,1),
  ('CEMENTO FRONTERA IP x 42.5 KG','IP','bolsa42.5',42.5,2),
  ('CEMENTO HS+R X 42.5 KG RUMI','HS','bolsa42.5',42.5,3),
  ('CEMENTO PORTLAND TIPO I X 42.5 KG YURA','TIPO I','bolsa42.5',42.5,4),
  ('CEMENTO YURA ANTISALITRE (MS) X 42.5 KG','MS','bolsa42.5',42.5,5),
  ('CEMENTO YURA MAX (HS) X 42.5KG','HS','bolsa42.5',42.5,6),
  ('CEMENTO YURA PRO (HE) 42.5KG','HE','bolsa42.5',42.5,7),
  ('CEMENTO YURA PRO EXPORT BRASIL x 42.5 kg','HE','bolsa42.5',42.5,8),
  ('CEMENTO BLANCO X 25 KG YURA NACIONAL','BLANCO','bolsa25',25,9),
  ('CEMENTO YURA PRO (HE) BBx1.5TM INC.ENV','HE','bigbag',1500,10),
  ('CEM ALT REST IN HE BB1.5TM YURA ENV CHIL','HE','bigbag',1500,11),
  ('CEM. PORT. PUZ. IP BBx1.5TM INC.ENV YURA','IP','bigbag',1500,12),
  ('CEM.YURA ANTISALITRE MS BBx1.5TM INC.ENV','MS','bigbag',1500,13),
  ('CEMENTO YURA MAX BBx1.5TM INC.ENV','HS','bigbag',1500,14),
  ('CEM. PORT. I BBx1.5TM INC.ENV YURA','TIPO I','bigbag',1500,15),
  ('CEMENTO YURA PRO (HE) GRANEL EN BOMBONA','HE','granel',null,16),
  ('CEMENTO YURA IP A GRANEL EN BOMBONA','IP','granel',null,17),
  ('CEMENTO YURA MAX GRANEL BOMBONA','HS','granel',null,18)
on conflict (nombre) do nothing;

-- Plan anual base 2026
insert into plan_anual (anio, plan_mensual, plan_anual) values
  (2026, 227210.594, 2726927.128)
on conflict (anio) do nothing;

-- Histórico despacho mensual 2024 y 2025 (TM)
insert into resumen_mensual_historico (anio, mes, despacho_tm) values
  (2024,1,204007.803),(2024,2,186305.944),(2024,3,199570.192),(2024,4,205343.728),
  (2024,5,209473.774),(2024,6,196506.860),(2024,7,219516.239),(2024,8,232937.965),
  (2024,9,231021.168),(2024,10,237591.573),(2024,11,215275.195),(2024,12,210045.588),
  (2025,1,190629.128),(2025,2,182874.285),(2025,3,197224.221),(2025,4,198970.758),
  (2025,5,212393.173),(2025,6,204590.000),(2025,7,222445.377),(2025,8,233567.971),
  (2025,9,234732.794),(2025,10,249609.074),(2025,11,242524.660),(2025,12,246279.444)
on conflict (anio, mes) do nothing;

-- Plan de ventas 2026 por familia (TM)
insert into plan_ventas_familia (anio, mes, familia, tm) values
  (2026,1,'gris_interno',192165.921),(2026,2,'gris_interno',179398.291),(2026,3,'gris_interno',194439.503),(2026,4,'gris_interno',198128.393),(2026,5,'gris_interno',210381.445),(2026,6,'gris_interno',199416.328),(2026,7,'gris_interno',215756.383),(2026,8,'gris_interno',223685.985),(2026,9,'gris_interno',235307.857),(2026,10,'gris_interno',237702.911),(2026,11,'gris_interno',226591.308),(2026,12,'gris_interno',225590.553),
  (2026,1,'gris_externo',11767.984),(2026,2,'gris_externo',12151.620),(2026,3,'gris_externo',12304.489),(2026,4,'gris_externo',11090.411),(2026,5,'gris_externo',10741.801),(2026,6,'gris_externo',12014.853),(2026,7,'gris_externo',13546.815),(2026,8,'gris_externo',12963.620),(2026,9,'gris_externo',12577.404),(2026,10,'gris_externo',13332.059),(2026,11,'gris_externo',13791.964),(2026,12,'gris_externo',13624.230),
  (2026,1,'blanco',1470),(2026,2,'blanco',1520),(2026,3,'blanco',1540),(2026,4,'blanco',1600),(2026,5,'blanco',1650),(2026,6,'blanco',1680),(2026,7,'blanco',1740),(2026,8,'blanco',1810),(2026,9,'blanco',1835),(2026,10,'blanco',1865),(2026,11,'blanco',1865),(2026,12,'blanco',1880),
  (2026,1,'filler',1425),(2026,2,'filler',1475),(2026,3,'filler',1500),(2026,4,'filler',1400),(2026,5,'filler',1500),(2026,6,'filler',1500),(2026,7,'filler',1600),(2026,8,'filler',1500),(2026,9,'filler',1500),(2026,10,'filler',1600),(2026,11,'filler',1500),(2026,12,'filler',1500)
on conflict (anio, mes, familia) do nothing;

-- Plan semanal inicial (vacío en 0)
insert into plan_semanal (dia, tm) values
  ('Lunes',0),('Martes',0),('Miércoles',0),('Jueves',0),('Viernes',0),('Sábado',0),('Domingo',0)
on conflict (dia) do nothing;
