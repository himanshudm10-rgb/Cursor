#!/bin/bash
cd "$(dirname "$0")"
read a b c d e < ranges.txt
arr=($a $b $c $d $e)
for i in 0 1 2 3; do
  OMP_NUM_THREADS=1 python3 film.py range ${arr[$i]} ${arr[$((i+1))]} parts/p$i.mp4 > parts/log$i.txt 2>&1 &
done
wait
echo ALL_DONE
