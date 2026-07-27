export interface Gruppe {
  value: number
  label: string
  RTH?: boolean
  nPol?: boolean
  THW?: boolean
  Pol?: boolean
  OA?: boolean
  Kreisweit?: boolean
  Landesweit?: boolean
  Bundesweit?: boolean
  PolKW?: number
  Zusatztext?: string
}

export interface UpdateState {
  appUpdate: boolean
  dataUpdate: boolean
  remoteAppVersion: string
  remoteDataVersion: string
  localAppVersion: string | null
  localDataVersion: string | null
  applyUpdate: () => void
}
