export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      compuerta_registro: {
        Row: {
          comentario: string
          horas: number
          numero: number
          parte_id: number
        }
        Insert: {
          comentario?: string
          horas?: number
          numero: number
          parte_id: number
        }
        Update: {
          comentario?: string
          horas?: number
          numero?: number
          parte_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "compuerta_registro_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "parte_diario"
            referencedColumns: ["id"]
          },
        ]
      }
      despacho: {
        Row: {
          bolsas: number
          id: number
          parte_id: number
          tipo_id: number
          tm: number
        }
        Insert: {
          bolsas?: number
          id?: never
          parte_id: number
          tipo_id: number
          tm?: number
        }
        Update: {
          bolsas?: number
          id?: never
          parte_id?: number
          tipo_id?: number
          tm?: number
        }
        Relationships: [
          {
            foreignKeyName: "despacho_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "parte_diario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despacho_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipo_cemento"
            referencedColumns: ["id"]
          },
        ]
      }
      maquina: {
        Row: {
          id: string
          nombre: string
          ratio_ideal: number
        }
        Insert: {
          id: string
          nombre: string
          ratio_ideal: number
        }
        Update: {
          id?: string
          nombre?: string
          ratio_ideal?: number
        }
        Relationships: []
      }
      maquina_registro: {
        Row: {
          averia_critica: string
          comentario: string
          horas_maquina: number
          maquina_id: string
          operativos: number
          parte_id: number
          ratio_ecs: number
        }
        Insert: {
          averia_critica?: string
          comentario?: string
          horas_maquina?: number
          maquina_id: string
          operativos?: number
          parte_id: number
          ratio_ecs?: number
        }
        Update: {
          averia_critica?: string
          comentario?: string
          horas_maquina?: number
          maquina_id?: string
          operativos?: number
          parte_id?: number
          ratio_ecs?: number
        }
        Relationships: [
          {
            foreignKeyName: "maquina_registro_maquina_id_fkey"
            columns: ["maquina_id"]
            isOneToOne: false
            referencedRelation: "maquina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maquina_registro_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "parte_diario"
            referencedColumns: ["id"]
          },
        ]
      }
      parte_diario: {
        Row: {
          acumulado_ajuste: number
          comentario: string
          created_at: string
          fecha: string
          id: number
          updated_at: string
          veh_llamado: number
          veh_playa: number
          veh_proceso: number
        }
        Insert: {
          acumulado_ajuste?: number
          comentario?: string
          created_at?: string
          fecha: string
          id?: never
          updated_at?: string
          veh_llamado?: number
          veh_playa?: number
          veh_proceso?: number
        }
        Update: {
          acumulado_ajuste?: number
          comentario?: string
          created_at?: string
          fecha?: string
          id?: never
          updated_at?: string
          veh_llamado?: number
          veh_playa?: number
          veh_proceso?: number
        }
        Relationships: []
      }
      plan_anual: {
        Row: {
          anio: number
          plan_anual: number
          plan_mensual: number
        }
        Insert: {
          anio: number
          plan_anual?: number
          plan_mensual?: number
        }
        Update: {
          anio?: number
          plan_anual?: number
          plan_mensual?: number
        }
        Relationships: []
      }
      plan_especial: {
        Row: {
          fecha: string
          tm: number
        }
        Insert: {
          fecha: string
          tm?: number
        }
        Update: {
          fecha?: string
          tm?: number
        }
        Relationships: []
      }
      plan_semanal: {
        Row: {
          dia: string
          tm: number
        }
        Insert: {
          dia: string
          tm?: number
        }
        Update: {
          dia?: string
          tm?: number
        }
        Relationships: []
      }
      plan_ventas_familia: {
        Row: {
          anio: number
          familia: string
          mes: number
          tm: number
        }
        Insert: {
          anio: number
          familia: string
          mes: number
          tm?: number
        }
        Update: {
          anio?: number
          familia?: string
          mes?: number
          tm?: number
        }
        Relationships: []
      }
      resumen_mensual_historico: {
        Row: {
          anio: number
          despacho_tm: number
          mes: number
        }
        Insert: {
          anio: number
          despacho_tm: number
          mes: number
        }
        Update: {
          anio?: number
          despacho_tm?: number
          mes?: number
        }
        Relationships: []
      }
      temporal: {
        Row: {
          capacidad: number
          id: number
          nombre: string
        }
        Insert: {
          capacidad: number
          id?: never
          nombre: string
        }
        Update: {
          capacidad?: number
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      temporal_registro: {
        Row: {
          inventario: number
          parte_id: number
          temporal_id: number
        }
        Insert: {
          inventario?: number
          parte_id: number
          temporal_id: number
        }
        Update: {
          inventario?: number
          parte_id?: number
          temporal_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "temporal_registro_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: false
            referencedRelation: "parte_diario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temporal_registro_temporal_id_fkey"
            columns: ["temporal_id"]
            isOneToOne: false
            referencedRelation: "temporal"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_cemento: {
        Row: {
          activo: boolean
          familia: string
          id: number
          nombre: string
          orden: number
          peso_kg: number | null
          presentacion: string
        }
        Insert: {
          activo?: boolean
          familia?: string
          id?: never
          nombre: string
          orden?: number
          peso_kg?: number | null
          presentacion?: string
        }
        Update: {
          activo?: boolean
          familia?: string
          id?: never
          nombre?: string
          orden?: number
          peso_kg?: number | null
          presentacion?: string
        }
        Relationships: []
      }
      venta_diaria: {
        Row: {
          a_construir_tm: number
          export_tm: number
          nacional_tm: number
          parte_id: number
        }
        Insert: {
          a_construir_tm?: number
          export_tm?: number
          nacional_tm?: number
          parte_id: number
        }
        Update: {
          a_construir_tm?: number
          export_tm?: number
          nacional_tm?: number
          parte_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "venta_diaria_parte_id_fkey"
            columns: ["parte_id"]
            isOneToOne: true
            referencedRelation: "parte_diario"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_comparativa_anual: {
        Row: {
          anio: number | null
          despacho_tm: number | null
          mes: number | null
        }
        Relationships: []
      }
      v_despacho_mensual: {
        Row: {
          anio: number | null
          despacho_tm: number | null
          mes: number | null
        }
        Relationships: []
      }
      v_despacho_mensual_live: {
        Row: {
          anio: number | null
          despacho_tm: number | null
          mes: number | null
        }
        Relationships: []
      }
      v_despacho_por_familia: {
        Row: {
          bolsas: number | null
          familia: string | null
          fecha: string | null
          tm: number | null
        }
        Relationships: []
      }
      v_participacion_dia: {
        Row: {
          bolsas: number | null
          familia: string | null
          fecha: string | null
          pct: number | null
          tipo: string | null
          tm: number | null
        }
        Relationships: []
      }
      v_plan_vs_real: {
        Row: {
          anio: number | null
          cumplimiento_pct: number | null
          mes: number | null
          plan_tm: number | null
          real_tm: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
