
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity": {
                  Row: {
                    "action": string,"actor_email": string,"actor_id": string,"at": string,"detail": string | null,"href": string,"id": string,"module": string,"target_label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_email"?: string,"actor_id"?: string,"at"?: string,"detail"?: string | null,"href": string,"id"?: string,"module": string,"target_label": string
                  }
                  Update: {
                    "action"?: string,"actor_email"?: string,"actor_id"?: string,"at"?: string,"detail"?: string | null,"href"?: string,"id"?: string,"module"?: string,"target_label"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_email": string | null,"actor_id": string | null,"after": Json | null,"at": string,"before": Json | null,"id": number,"item": string,"row_id": string,"table_name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_email"?: string | null,"actor_id"?: string | null,"after"?: Json | null,"at"?: string,"before"?: Json | null,"id"?: never,"item": string,"row_id": string,"table_name": string
                  }
                  Update: {
                    "action"?: string,"actor_email"?: string | null,"actor_id"?: string | null,"after"?: Json | null,"at"?: string,"before"?: Json | null,"id"?: never,"item"?: string,"row_id"?: string,"table_name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"awards": {
                  Row: {
                    "created_at": string,"created_by": string | null,"event": NonNullable<Json>,"event_code": string | null,"extra_id": string | null,"id": string,"name": NonNullable<Json>,"season_id": string,"type": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"event": NonNullable<Json>,"event_code"?: string | null,"extra_id"?: string | null,"id"?: string,"name": NonNullable<Json>,"season_id": string,"type"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"event"?: NonNullable<Json>,"event_code"?: string | null,"extra_id"?: string | null,"id"?: string,"name"?: NonNullable<Json>,"season_id"?: string,"type"?: string | null,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "awards_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "awards_extra_id_fkey"
      columns: ["extra_id"]
isOneToOne: false
      referencedRelation: "season_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "awards_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "awards_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "awards_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"blog_posts": {
                  Row: {
                    "body": NonNullable<Json>,"cover": string | null,"created_at": string,"created_by": string | null,"excerpt": NonNullable<Json>,"id": string,"projects": (string)[],"publish_at": string | null,"published_at": string | null,"season_id": string | null,"seo": NonNullable<Json>,"slug": string,"status": string,"title": NonNullable<Json>,"topics": (string)[],"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"cover"?: string | null,"created_at"?: string,"created_by"?: string | null,"excerpt": NonNullable<Json>,"id"?: string,"projects"?: (string)[],"publish_at"?: string | null,"published_at"?: string | null,"season_id"?: string | null,"seo"?: NonNullable<Json>,"slug": string,"status"?: string,"title": NonNullable<Json>,"topics"?: (string)[],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"cover"?: string | null,"created_at"?: string,"created_by"?: string | null,"excerpt"?: NonNullable<Json>,"id"?: string,"projects"?: (string)[],"publish_at"?: string | null,"published_at"?: string | null,"season_id"?: string | null,"seo"?: NonNullable<Json>,"slug"?: string,"status"?: string,"title"?: NonNullable<Json>,"topics"?: (string)[],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "blog_posts_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "blog_posts_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blog_posts_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blog_posts_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"blog_topics": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"name": NonNullable<Json>,"slug": string,"sort": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id": string,"name": NonNullable<Json>,"slug": string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: NonNullable<Json>,"slug"?: string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "blog_topics_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "blog_topics_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"budget_lines": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string | null,"id": string,"name": NonNullable<Json>,"season_id": string,"sort": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name": NonNullable<Json>,"season_id": string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: NonNullable<Json>,"season_id"?: string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "budget_lines_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "budget_lines_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_budgets"
      referencedColumns: ["season_id"]
    },{
      foreignKeyName: "budget_lines_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"departments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"description": NonNullable<Json>,"id": string,"name": NonNullable<Json>,"photos": NonNullable<Json>,"sort": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: NonNullable<Json>,"id": string,"name": NonNullable<Json>,"photos"?: NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"description"?: NonNullable<Json>,"id"?: string,"name"?: NonNullable<Json>,"photos"?: NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "departments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "departments_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"email_codes": {
                  Row: {
                    "attempts": number,"code_hash": string,"consumed_at": string | null,"created_at": string,"expires_at": string,"id": string,"session_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"code_hash": string,"consumed_at"?: string | null,"created_at"?: string,"expires_at": string,"id"?: string,"session_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "attempts"?: number,"code_hash"?: string,"consumed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"session_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_codes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"faq_items": {
                  Row: {
                    "answer": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"question": NonNullable<Json>,"sort": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "answer"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"question": NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "answer"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"question"?: NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "faq_items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "faq_items_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"form230_callout": {
                  Row: {
                    "created_at": string,"created_by": string | null,"ends_on": string,"id": number,"label": string | null,"link": string,"starts_on": string,"text": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"ends_on": string,"id"?: number,"label"?: never,"link"?: string,"starts_on": string,"text"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"ends_on"?: string,"id"?: number,"label"?: never,"link"?: string,"starts_on"?: string,"text"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "form230_callout_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "form230_callout_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"gallery_items": {
                  Row: {
                    "alt": NonNullable<Json>,"caption": NonNullable<Json>,"created_at": string,"created_by": string | null,"date": string | null,"featured": boolean,"height": number,"id": string,"key": string | null,"kind": string,"season_id": string | null,"updated_at": string,"updated_by": string | null,"width": number,"youtube_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: NonNullable<Json>,"caption"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"date"?: string | null,"featured"?: boolean,"height": number,"id"?: string,"key"?: string | null,"kind": string,"season_id"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"width": number,"youtube_id"?: string | null
                  }
                  Update: {
                    "alt"?: NonNullable<Json>,"caption"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"date"?: string | null,"featured"?: boolean,"height"?: number,"id"?: string,"key"?: string | null,"kind"?: string,"season_id"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"width"?: number,"youtube_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gallery_items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "gallery_items_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gallery_items_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gallery_items_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"home_hero": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": number,"intro": NonNullable<Json>,"label": string | null,"media": string | null,"media_type": string,"poster": string | null,"tagline": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: number,"intro"?: NonNullable<Json>,"label"?: never,"media"?: string | null,"media_type"?: string,"poster"?: string | null,"tagline"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: number,"intro"?: NonNullable<Json>,"label"?: never,"media"?: string | null,"media_type"?: string,"poster"?: string | null,"tagline"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "home_hero_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "home_hero_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"impact_numbers": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"label": NonNullable<Json>,"sort": number,"suffix": string,"updated_at": string,"updated_by": string | null,"value": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id": string,"label": NonNullable<Json>,"sort"?: number,"suffix"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"label"?: NonNullable<Json>,"sort"?: number,"suffix"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "impact_numbers_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "impact_numbers_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"join_page": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": number,"label": string | null,"requirements": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"requirements"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"requirements"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "join_page_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "join_page_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"link_cards": {
                  Row: {
                    "created_at": string,"created_by": string | null,"display_url": string,"ends_on": string | null,"highlighted": boolean,"icon": string | null,"id": string,"sort": number,"starts_on": string | null,"title": string,"updated_at": string,"updated_by": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"display_url"?: string,"ends_on"?: string | null,"highlighted"?: boolean,"icon"?: string | null,"id"?: string,"sort"?: number,"starts_on"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null,"url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"display_url"?: string,"ends_on"?: string | null,"highlighted"?: boolean,"icon"?: string | null,"id"?: string,"sort"?: number,"starts_on"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "link_cards_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "link_cards_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"media": {
                  Row: {
                    "folder": string,"height": number | null,"key": string,"kind": string,"poster": string | null,"size": number | null,"uploaded_at": string,"uploaded_by": string,"width": number | null,"widths": (number)[] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "folder"?: string,"height"?: number | null,"key": string,"kind": string,"poster"?: string | null,"size"?: number | null,"uploaded_at"?: string,"uploaded_by"?: string,"width"?: number | null,"widths"?: (number)[] | null
                  }
                  Update: {
                    "folder"?: string,"height"?: number | null,"key"?: string,"kind"?: string,"poster"?: string | null,"size"?: number | null,"uploaded_at"?: string,"uploaded_by"?: string,"width"?: number | null,"widths"?: (number)[] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"members": {
                  Row: {
                    "deactivated_at": string | null,"email": string,"invited_at": string,"invited_by": string | null,"last_sign_in_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deactivated_at"?: string | null,"email": string,"invited_at"?: string,"invited_by"?: string | null,"last_sign_in_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "deactivated_at"?: string | null,"email"?: string,"invited_at"?: string,"invited_by"?: string | null,"last_sign_in_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_invited_by_fkey"
      columns: ["invited_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"permissions": {
                  Row: {
                    "description": string,"id": string,"label": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"id": string,"label": string,"sort"?: number
                  }
                  Update: {
                    "description"?: string,"id"?: string,"label"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"press_kit": {
                  Row: {
                    "contact_email": string,"created_at": string,"created_by": string | null,"id": number,"label": string | null,"long_description": NonNullable<Json>,"marks": NonNullable<Json>,"photos": NonNullable<Json>,"short_description": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"long_description"?: NonNullable<Json>,"marks"?: NonNullable<Json>,"photos"?: NonNullable<Json>,"short_description"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "contact_email"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"long_description"?: NonNullable<Json>,"marks"?: NonNullable<Json>,"photos"?: NonNullable<Json>,"short_description"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "press_kit_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "press_kit_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "body": NonNullable<Json>,"created_at": string,"created_by": string | null,"external": string | null,"facts": NonNullable<Json>,"id": string,"logo": string | null,"name": NonNullable<Json>,"partners": NonNullable<Json>,"photos": NonNullable<Json>,"slug": string,"sort": number,"stats": NonNullable<Json>,"summary": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"external"?: string | null,"facts"?: NonNullable<Json>,"id": string,"logo"?: string | null,"name": NonNullable<Json>,"partners"?: NonNullable<Json>,"photos"?: NonNullable<Json>,"slug": string,"sort"?: number,"stats"?: NonNullable<Json>,"summary": NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"external"?: string | null,"facts"?: NonNullable<Json>,"id"?: string,"logo"?: string | null,"name"?: NonNullable<Json>,"partners"?: NonNullable<Json>,"photos"?: NonNullable<Json>,"slug"?: string,"sort"?: number,"stats"?: NonNullable<Json>,"summary"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "projects_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"publish_runs": {
                  Row: {
                    "duration_sec": number | null,"finished_at": string | null,"id": string,"started_at": string,"started_by": string | null,"state": string,"targets": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "duration_sec"?: number | null,"finished_at"?: string | null,"id"?: string,"started_at"?: string,"started_by"?: string | null,"state"?: string,"targets": (string)[]
                  }
                  Update: {
                    "duration_sec"?: number | null,"finished_at"?: string | null,"id"?: string,"started_at"?: string,"started_by"?: string | null,"state"?: string,"targets"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "publish_runs_started_by_fkey"
      columns: ["started_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"publish_tables": {
                  Row: {
                    "table_name": string,"target": string
                  }
                  ComputedFields: never
                  Insert: {
                    "table_name": string,"target": string
                  }
                  Update: {
                    "table_name"?: string,"target"?: string
                  }
                  Relationships: [
                    
                  ]
                },"season_budgets": {
                  Row: {
                    "created_at": string,"created_by": string | null,"remaining": number,"season_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"remaining"?: number,"season_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"remaining"?: number,"season_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "season_budgets_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "season_budgets_season_id_fkey"
      columns: ["season_id"]
isOneToOne: true
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_budgets_season_id_fkey"
      columns: ["season_id"]
isOneToOne: true
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_budgets_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"season_event_overrides": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"note": string,"rank": number | null,"result": NonNullable<Json>,"season_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by"?: string | null,"note"?: string,"rank"?: number | null,"result"?: NonNullable<Json>,"season_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"note"?: string,"rank"?: number | null,"result"?: NonNullable<Json>,"season_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "season_event_overrides_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "season_event_overrides_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_event_overrides_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_event_overrides_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"season_events": {
                  Row: {
                    "created_at": string,"created_by": string | null,"date": string,"id": string,"name": NonNullable<Json>,"place": NonNullable<Json>,"place_url": string,"result": NonNullable<Json>,"season_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"date": string,"id"?: string,"name": NonNullable<Json>,"place"?: NonNullable<Json>,"place_url"?: string,"result"?: NonNullable<Json>,"season_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"date"?: string,"id"?: string,"name"?: NonNullable<Json>,"place"?: NonNullable<Json>,"place_url"?: string,"result"?: NonNullable<Json>,"season_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "season_events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "season_events_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_events_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "season_events_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"seasons": {
                  Row: {
                    "created_at": string,"created_by": string | null,"current": boolean,"ftc": number | null,"game": string,"game_logo": string | null,"id": string,"onshape": string,"portfolio_cover": string | null,"portfolio_pdf": string | null,"robot": string | null,"start_year": number | null,"team_photo": string | null,"updated_at": string,"updated_by": string | null,"years": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"current"?: boolean,"ftc"?: number | null,"game": string,"game_logo"?: string | null,"id": string,"onshape"?: string,"portfolio_cover"?: string | null,"portfolio_pdf"?: string | null,"robot"?: string | null,"start_year"?: never,"team_photo"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"years": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"current"?: boolean,"ftc"?: number | null,"game"?: string,"game_logo"?: string | null,"id"?: string,"onshape"?: string,"portfolio_cover"?: string | null,"portfolio_pdf"?: string | null,"robot"?: string | null,"start_year"?: never,"team_photo"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"years"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "seasons_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "seasons_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"short_urls": {
                  Row: {
                    "created_at": string,"created_by": string | null,"slug": string,"updated_at": string,"updated_by": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"slug": string,"updated_at"?: string,"updated_by"?: string | null,"url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"slug"?: string,"updated_at"?: string,"updated_by"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "short_urls_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "short_urls_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "address": NonNullable<Json>,"association_name": string,"bank": string,"branch": NonNullable<Json>,"cif": string,"created_at": string,"created_by": string | null,"email": string,"iban": string,"id": number,"maps_embed": string,"maps_link": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": NonNullable<Json>,"association_name": string,"bank": string,"branch": NonNullable<Json>,"cif": string,"created_at"?: string,"created_by"?: string | null,"email": string,"iban": string,"id"?: number,"maps_embed"?: string,"maps_link"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: NonNullable<Json>,"association_name"?: string,"bank"?: string,"branch"?: NonNullable<Json>,"cif"?: string,"created_at"?: string,"created_by"?: string | null,"email"?: string,"iban"?: string,"id"?: number,"maps_embed"?: string,"maps_link"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"social_links": {
                  Row: {
                    "created_at": string,"created_by": string | null,"network": string,"sort": number,"updated_at": string,"updated_by": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"network": string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null,"url": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"network"?: string,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "social_links_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"sponsor_benefits": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"sort": number,"text": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"sort"?: number,"text": NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"sort"?: number,"text"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sponsor_benefits_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "sponsor_benefits_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"sponsor_decks": {
                  Row: {
                    "created_at": string,"created_by": string | null,"file": string | null,"season_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"file"?: string | null,"season_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"file"?: string | null,"season_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sponsor_decks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "sponsor_decks_season_id_fkey"
      columns: ["season_id"]
isOneToOne: true
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sponsor_decks_season_id_fkey"
      columns: ["season_id"]
isOneToOne: true
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sponsor_decks_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"sponsor_tiers": {
                  Row: {
                    "amount": number,"benefits": number,"created_at": string,"created_by": string | null,"id": string,"name": NonNullable<Json>,"sort": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"benefits"?: number,"created_at"?: string,"created_by"?: string | null,"id": string,"name": NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "amount"?: number,"benefits"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: NonNullable<Json>,"sort"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "sponsor_tiers_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "sponsor_tiers_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"sponsors": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"logo": string | null,"name": string,"season_id": string,"tier_id": string,"updated_at": string,"updated_by": string | null,"website": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id": string,"logo"?: string | null,"name": string,"season_id": string,"tier_id": string,"updated_at"?: string,"updated_by"?: string | null,"website"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"logo"?: string | null,"name"?: string,"season_id"?: string,"tier_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"website"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sponsors_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "sponsors_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "season_summaries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sponsors_season_id_fkey"
      columns: ["season_id"]
isOneToOne: false
      referencedRelation: "seasons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sponsors_tier_id_fkey"
      columns: ["tier_id"]
isOneToOne: false
      referencedRelation: "sponsor_tiers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sponsors_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"support_docs": {
                  Row: {
                    "contract": string | null,"contract_text": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": number,"label": string | null,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contract"?: string | null,"contract_text"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "contract"?: string | null,"contract_text"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: number,"label"?: never,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "support_docs_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "support_docs_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"team_page": {
                  Row: {
                    "created_at": string,"created_by": string | null,"drive": NonNullable<Json>,"id": number,"label": string | null,"mission": NonNullable<Json>,"students_do": NonNullable<Json>,"team_photo": string | null,"updated_at": string,"updated_by": string | null,"values": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"drive"?: NonNullable<Json>,"id"?: number,"label"?: never,"mission"?: NonNullable<Json>,"students_do"?: NonNullable<Json>,"team_photo"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"values"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"drive"?: NonNullable<Json>,"id"?: number,"label"?: never,"mission"?: NonNullable<Json>,"students_do"?: NonNullable<Json>,"team_photo"?: string | null,"updated_at"?: string,"updated_by"?: string | null,"values"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_page_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "team_page_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"timeline_milestones": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"image": string | null,"occurred_on": string,"text": NonNullable<Json>,"title": NonNullable<Json>,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"image"?: string | null,"occurred_on": string,"text"?: NonNullable<Json>,"title": NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"image"?: string | null,"occurred_on"?: string,"text"?: NonNullable<Json>,"title"?: NonNullable<Json>,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "timeline_milestones_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "timeline_milestones_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"trusted_devices": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"last_used_at": string | null,"token_hash": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at": string,"id"?: string,"last_used_at"?: string | null,"token_hash": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"last_used_at"?: string | null,"token_hash"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trusted_devices_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"user_permissions": {
                  Row: {
                    "granted_at": string,"granted_by": string | null,"permission": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granted_at"?: string,"granted_by"?: string | null,"permission": string,"user_id": string
                  }
                  Update: {
                    "granted_at"?: string,"granted_by"?: string | null,"permission"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_permissions_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "user_permissions_permission_fkey"
      columns: ["permission"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "user_permissions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"verified_sessions": {
                  Row: {
                    "method": string,"session_id": string,"user_id": string,"verified_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "method": string,"session_id": string,"user_id": string,"verified_at"?: string
                  }
                  Update: {
                    "method"?: string,"session_id"?: string,"user_id"?: string,"verified_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "verified_sessions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["user_id"]
    }
                  ]
                }
          }
          Views: {
            "season_summaries": {
                  Row: {
                    "current": boolean,"game": string,"id": string,"years": string
                  }
                  ComputedFields: never
                  Insert: {
                           "current"?: boolean | null,"game"?: string | null,"id"?: string | null,"years"?: string | null
                         }
                        Update: {
                           "current"?: boolean | null,"game"?: string | null,"id"?: string | null,"years"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "admin_set_member":
{ Args: { "p_actor": string,"p_deactivated_at": string,"p_invited_by": string,"p_user": string }; Returns: undefined
                           },
"custom_access_token_hook":
{ Args: { "event": Json }; Returns: Json
                           },
"enable_content":
{ Args: { "publish_target"?: string,"tbl": unknown }; Returns: undefined
                           },
"has_any_cms":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"has_permission":
{ Args: { "p": string }; Returns: boolean
                           },
"is_bilingual":
{ Args: { "v": Json }; Returns: boolean
                           },
"is_member":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"my_session":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"publish_status":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"reorder_socials":
{ Args: { "p_order": (string)[] }; Returns: undefined
                           },
"set_current_season":
{ Args: { "p_id": string }; Returns: undefined
                           },
"set_permissions":
{ Args: { "p_actor": string,"p_permissions": (string)[],"p_user": string }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
