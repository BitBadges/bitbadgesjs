import { BadgeMetadata } from './types';

export const METADATA_PAGE_LIMIT = 100;

export const MAX_DATE_TIMESTAMP = 8640000000000000 / 1000;

export const GO_MAX_UINT_64 = 1000000000000000; //TODO: match with go value

export const CHAIN_DETAILS = {
    chainId: 1,
    cosmosChainId: 'bitbadges_1-1',
}

export const DefaultPlaceholderMetadata: BadgeMetadata = {
    name: 'Placeholder',
    description: '',
    image: 'https://png.pngtree.com/element_pic/00/16/07/18578cd65e6ecaa.jpg'
}

export const ErrorMetadata: BadgeMetadata = {
    name: 'Error',
    image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAAb1BMVEX/////AAD/+vr/YWH/VFT/8/P/bW3/Rkb/XFz/2tr/ZGT/Z2f/Vlb/9/f/WFj/Xl7/4uL/cXH/Ly//tbX/UFD/5+f/JCT/urr/jo7/h4f/gYH/xcX/TEz/sLD/dnb/o6P/lpb/FRX/QED/qqr/nJw/P8M9AAAEa0lEQVR4nMVbbXvbIAw0TdzGeWncNHHbteuWbv//Ny5gQ/0CnADp2X2N7EO6M0EGV9UU7VMliveX+O9Np3Z3kvxKPUf5T0qpe7kR3PijI7h0OkCtRPmVeg/93qoBa1F+pQI+aDobIOMDxx9QwehvIeCDEb93BJduHKC2ovweFS5qBmYfvM/vP3Ni080D1JZThQX/rAYT/QV84OGfjKBd5q+xE+UfqbDQ34LJBwF+NwKP/hYrDhWC/IMKXv0tGHwQ4TcjCOhvUeyDKL9WYRsPKPUB4Fdf1d0GhBxLVED850NV1SsQVOADxP9Y66h6D8KyfYD4P+oh8AENNI//Bdz2y5X27hGEbiTyX4+klfAByn9Tj6NrVIN7bv51PbsA+SBRBbr+DqgGSU6E+XskhT5IWKmm6e9GgOZEsg8Q/97Lf3sakQ+OPPwe/S3QnLjn4D9Hrj0w+ADxHwP174F9gEaA+B+j/AQfgM4V8T8cQAJVtQa3iK5QnksuHlDiA5T/Cud/Q30Etwn6oMx/oxp8gBsFOldU/w9S/gZncCuvlD/BRbHnf1GDDB+g/Gn6W6T7APIT9Xc1SPQB4j8n5W+ARjDxAaf+rgZIhdEbDFj/rNaCvlJF/Nv0+vc1QE/jjsa/z+Sv8ErV+OAPCPrIpq9w53oTF/mv7CUH9MEn4t/l19/ggP6dATblr1iQD6Io0d8C+iACnhe+0AdBlOrvRoBW6wEcmfirTB/kzP8hwDcYHvBu/KT7gEt/N4LEGqStf0hI8gGn/g4JNWDf8DGg+0Bq6xN2rgPkNn9h52ogtO3Zg/DfKLbxa3C4R/zJLxQT8es/DwDyC0vwF/OLmpCQv4bYY0jkF5uIyPxCU/FvOr+ID0j+G9WAW4WE+vdg9kFi/hpse+8aSfpbMPogI38NNh8k62/B5IPM/DVYfJClvwWDDwry1yg+g4H4n3YgoNAHiH+H32AU+eAV3Nxsp6KVKmmnyw/kv375hc9g5PKj+n8OcVJnMBD/9/ITdq5ZPiDpbyFwBgPxz47/sp/BQP77nMVz+wDxL48/857BQPX3NR+wc01QAfEHkkFv88hOTNXfgusMRi4/x967Bqp/rOngOIPxhpKIX160966RX/8epWcwSvlLfYD0p/yplJzBQPoTP//I2nun5P+Dxp/tg3L9LfLOYGTOv/4aZJzB+AEuSfz8J2nvnZI/VX9Xg4S9dwn+1BUK4qf7b1QD4t67BrP+FmQfoPknvf5DDZAPhs6VX38Lmg9Q/jn6uxoQOtfE9X8q0D/TE/rAIb/+PUDn2rXgE4+3Qn7gg1OjQ5qrWP4ah/Bq/dr0IcHPfJg+/wz64GIjWn8NOPLXCPhA62/h/dSoXH8Lrw9OzTjE4wOu/M0Ilp1r10xD2nlAyfzjwcIHl3nEzAec+RtMa9At+Gc+4NPfYuKDU+MLGfmAn3/ig7n+Fs4HzPoP+O5Y2lBIK5e/QT8nXj36WxgfiPH3PvDr70ZwFeQ3nWtIfzeCV0H+mw+2c/3/AXHcOnlC34CsAAAAAElFTkSuQmCC',
    description: 'Error'
};
