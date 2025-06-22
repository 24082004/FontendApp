import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

const MovieDetailScreen = ({ route }) => {
  const {
    title,
    duration,
    releaseDate,
    genre,
    rating,
    votes,
    image,
  } = route.params;

  return (
    <ScrollView style={styles.container}>
      <ImageBackground source={image} style={styles.backgroundImage}>
        <View style={styles.overlayBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subTitle}>
            {duration} • {releaseDate}
          </Text>
          <View style={styles.reviewRow}>
            <Text style={styles.rating}>⭐ {rating}</Text>
            <Text style={styles.reviewCount}>({votes})</Text>
            <TouchableOpacity style={styles.trailerBtn}>
              <Text style={styles.trailerText}>▶ Xem trailer</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.starRow}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.star}>
                ☆
              </Text>
            ))}
          </View>
        </View>
      </ImageBackground>

      <View style={styles.section}>
        <Text style={styles.label}>
          Thể loại: <Text style={styles.bold}>{genre}</Text>
        </Text>
        <Text style={styles.label}>
          Phân loại: <Text style={styles.bold}>13+</Text>
        </Text>
        <Text style={styles.label}>
          Ngôn ngữ: <Text style={styles.bold}>Tiếng Anh</Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Nội dung</Text>
        <Text style={styles.description}>
          Avengers và các đồng minh của họ tiếp tục bảo vệ thế giới khỏi
          những mối đe dọa quá lớn cho bất kỳ siêu anh hùng nào. Một mối
          nguy hiểm mới đã xuất hiện từ bóng tối vũ trụ: Thanos... Xem thêm
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Đạo diễn</Text>
        <View style={styles.personRowHorizontal}>
          <View style={styles.personBox}>
            <Image
              source={require('../Asset/anthony.png')}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>Anthony Russo</Text>
          </View>
          <View style={styles.personBox}>
            <Image
              source={require('../Asset/joe.png')}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>Joe Russo</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Diễn viên</Text>
        <View style={styles.personRowHorizontal}>
          <View style={styles.personBox}>
            <Image
              source={require('../Asset/robert.png')}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>Robert Downey Jr.</Text>
          </View>
          <View style={styles.personBox}>
            <Image
              source={require('../Asset/chris_hemsworth.png')}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>Chris Hemsworth</Text>
          </View>
          <View style={styles.personBox}>
            <Image
              source={require('../Asset/chris_evans.png')}
              style={styles.personImageHorizontal}
            />
            <Text style={styles.personNameHorizontal}>Chris Evans</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>Rạp chiếu</Text>

        <View style={styles.cinemaBoxSelected}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cinemaName}>Vincom Ocean Park CGV</Text>
            <Text style={styles.cinemaDetail}>
              4.55 km | Đa Tốn, Gia Lâm, Hà Nội
            </Text>
          </View>
          <Image
            source={require('../Asset/cgv_logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.cinemaBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cinemaName}>Aeon Mall CGV</Text>
            <Text style={styles.cinemaDetail}>
              9.32 km | 27 Cổ Linh, Long Biên, Hà Nội
            </Text>
          </View>
          <Image
            source={require('../Asset/cgv_logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.cinemaBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cinemaName}>Lotte Cinema Long Biên</Text>
            <Text style={styles.cinemaDetail}>
              14.3 km | 7-9 Nguyễn Văn Linh, Long Biên, Hà Nội
            </Text>
          </View>
          <Image
            source={require('../Asset/lotte_logo.png')}
            style={styles.logo}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.continueBtn}>
        <Text style={styles.continueText}>Tiếp tục</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    height: 250,
    justifyContent: 'flex-end',
  },
  overlayBox: {
    backgroundColor: '#1e1e1e',
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subTitle: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rating: {
    color: 'gold',
    marginRight: 4,
  },
  reviewCount: {
    color: '#999',
    fontSize: 12,
  },
  trailerBtn: {
    marginLeft: 'auto',
    padding: 4,
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 4,
  },
  trailerText: {
    color: '#fff',
    fontSize: 12,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  star: {
    color: '#666',
    fontSize: 20,
    marginRight: 4,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 4,
  },
  bold: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 13,
  },
  cinemaBox: {
    backgroundColor: '#2c2c2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaBoxSelected: {
    backgroundColor: '#3a2c12',
    borderColor: '#ffc107',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cinemaDetail: {
    color: '#ccc',
    fontSize: 12,
  },
  logo: {
    width: 40,
    height: 20,
    resizeMode: 'contain',
    marginLeft: 12,
  },
  continueBtn: {
    backgroundColor: '#ffc107',
    padding: 14,
    borderRadius: 30,
    margin: 16,
    alignItems: 'center',
  },
  continueText: {
    fontWeight: 'bold',
    color: '#000',
  },
  personRowHorizontal: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  personBox: {
    alignItems: 'center',
    width: 80,
  },
  personImageHorizontal: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 4,
  },
  personNameHorizontal: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MovieDetailScreen;
