module.exports = {
  api: [
    {
      name: 'basic API call',
      template: {
        'Fn::Include': {
          type: 'api',
          service: 'EC2',
          action: 'describeRegions',
          query: 'Regions[*].RegionName[]',
        },
      },
      output: function (res) {
        return res.indexOf('us-east-1') !== -1;
      },
    },
    {
      name: 'API call in Fn::Map',
      template: {
        'Fn::Merge': {
          'Fn::Map': [
            {
              'Fn::Include': {
                type: 'api',
                service: 'EC2',
                action: 'describeRegions',
                query: 'Regions[*].RegionName[]',
              },
            },
            { _: true },
          ],
        },
      },
      output: function (res) {
        return res['us-east-1'] === true;
      },
    },
    {
      name: 'Loop through all regions and call an API for each',
      template: {
        'Fn::Merge': {
          'Fn::Map': [
            {
              'Fn::Include': {
                type: 'api',
                service: 'EC2',
                action: 'describeRegions',
                query: 'Regions[*].RegionName[]',
              },
            },
            {
              _: {
                AMI: {
                  'Fn::Include': {
                    type: 'api',
                    service: 'EC2',
                    action: 'describeImages',
                    region: '_',
                    query: 'Images[*].ImageId | [0]',
                    parameters: {
                      Filters: [
                        {
                          Name: 'manifest-location',
                          Values: ['amazon/amzn-ami-hvm-2016.03.3.x86_64-gp2'],
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      },
      output: function (res) {
        return !!(res['us-east-1'] && res['us-east-1'].AMI);
      },
    },
  ],
};
