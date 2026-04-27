export interface Game {
  id: string
  name: string
  description: string
  imageUrl: string
  link: string
  platform?: 'steam' | 'appstore'
}
