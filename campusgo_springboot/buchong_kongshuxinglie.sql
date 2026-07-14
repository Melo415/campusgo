UPDATE tb_shop 
SET score = FLOOR(RAND() * 51)
WHERE score IS NULL 
  AND id > 0;  -- 假设 id 是主键，且值 > 0
  
UPDATE tb_shop 
SET avg_price = FLOOR(RAND() * 41) + 10
WHERE avg_price IS NULL 
  AND id > 0;  -- 假设 id 是主键，且值 > 0
  
UPDATE tb_shop 
SET sold = FLOOR(RAND() * 1000001)
WHERE sold IS NULL 
  AND id > 0;  -- 假设 id 是主键，且值 > 0
  
UPDATE tb_shop 
SET comments = FLOOR(RAND() * 101)
WHERE comments IS NULL 
  AND id > 0;  -- 假设 id 是主键，且值 > 0
  
UPDATE tb_shop 
SET score = FLOOR(RAND() * 51)
WHERE score IS NULL 
  AND id > 0;  -- 假设 id 是主键，且值 > 0