```mermaid
graph TD
    A[Main Corporate Website] --> D{API Server}
    B[Corporate Admin Page] --> D
    C[Total Admin Page] --> D

    D --> E(Supabase)
    D --> F(Tax Invoice API)
    D --> G(Payment Gateway)
```
